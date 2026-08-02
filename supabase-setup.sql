-- =====================================================================
--  Abendbrett — Einrichtung der geteilten Ablage (Version 3)
--  Einmal im Supabase SQL-Editor ausführen: Projekt -> SQL Editor -> New query
--  Das Skript ist mehrfach ausführbar (idempotent).
-- =====================================================================
--
--  SICHERHEITSMODELL
--  -----------------
--  Der "anon key" steckt im ausgelieferten JavaScript und ist damit öffentlich.
--
--    * anon hat KEINE Rechte auf der Tabelle selbst.
--    * Zugriff nur über SECURITY-DEFINER-Funktionen, die zwingend den
--      Kosmos-Code als Argument verlangen.
--    * Gespeichert wird nur ein gesalzener SHA-256-Hash des Codes.
--
--  NEU in Version 3
--  ----------------
--   1. SHA-256 mit projektindividuellem Salz statt blankem MD5. MD5 ist
--      gebrochen, und ein ungesalzener Hash eines kurzen, von Menschen
--      gewählten Codes lässt sich per Wörterbuch in Minuten zurückrechnen.
--   2. board_peek verrät keine Mitgliedsnamen mehr, nur noch deren Anzahl.
--      Vorher konnte jeder, der einen Code erriet, echte Vornamen auslesen.
--   3. board_save verlangt zwingend einen Ausgangsstand (p_based_on). Vorher
--      bedeutete NULL "ungeprüft überschreiben" — genau der Zustand nach einem
--      fehlgeschlagenen Ladevorgang. Ein Netzwerkfehler konnte so den ganzen
--      Kosmos leeren.
--   4. board_join verändert updated_at nicht mehr und kennt einen Probelauf.
--
--  Was das NICHT leistet: Wer einen Code kennt oder errät, kommt an die Daten.
--  Es gibt keine Anmeldung und keine Ratenbegrenzung — dagegen hilft nur ein
--  langer, nicht erratbarer Code. Für echten Schutz wäre Supabase Auth mit
--  nutzerbezogenen Policies nötig.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tabelle ----------
create table if not exists public.abendbrett_boards (
  code_hash  text primary key,
  custom     jsonb       not null default '[]'::jsonb,
  hidden     jsonb       not null default '[]'::jsonb,
  members    jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS an, aber ohne jede Policy: damit kommt anon über die Tabelle nicht heran.
alter table public.abendbrett_boards enable row level security;

drop policy if exists "abendbrett boards anon select" on public.abendbrett_boards;
drop policy if exists "abendbrett boards anon upsert" on public.abendbrett_boards;
drop policy if exists "abendbrett boards anon update" on public.abendbrett_boards;

revoke all on table public.abendbrett_boards from anon, authenticated;

-- ---------- Salz ----------
-- WICHTIG: Diesen Wert einmalig durch eine eigene Zufallszeichenkette ersetzen
--   select encode(gen_random_bytes(24), 'hex');
-- und danach NICHT mehr ändern — sonst sind bestehende Kosmen nicht mehr auffindbar.
create or replace function public.abendbrett_salz()
returns text
language sql
immutable
as $$
  select 'BITTE-DURCH-EIGENEN-ZUFALLSWERT-ERSETZEN';
$$;

revoke all on function public.abendbrett_salz() from public;

create or replace function public.abendbrett_hash(p_code text)
returns text
language sql
stable
as $$
  select encode(
    digest(public.abendbrett_salz() || ':' || coalesce(trim(lower(p_code)), ''), 'sha256'),
    'hex'
  );
$$;

revoke all on function public.abendbrett_hash(text) from public;

-- ---------- gemeinsame Eingangsprüfung ----------
create or replace function public.abendbrett_pruefe_code(p_code text)
returns void
language plpgsql
immutable
as $$
begin
  if length(coalesce(trim(p_code), '')) < 8 then
    raise exception 'Kosmos-Code zu kurz (mindestens 8 Zeichen)';
  end if;
  if length(p_code) > 120 then
    raise exception 'Kosmos-Code zu lang';
  end if;
end;
$$;

-- ---------- Vorabblick ----------
-- Gibt bewusst NUR Zähler zurück, keine Namen.
create or replace function public.board_peek(p_code text)
returns table (
  "exists"     boolean,
  custom_count integer,
  hidden_count integer,
  member_count integer,
  updated_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  perform public.abendbrett_pruefe_code(p_code);
  v_hash := public.abendbrett_hash(p_code);

  return query
  select true,
         jsonb_array_length(b.custom),
         jsonb_array_length(b.hidden),
         jsonb_array_length(b.members),
         b.updated_at
  from public.abendbrett_boards b
  where b.code_hash = v_hash;

  if not found then
    return query select false, 0, 0, 0, null::timestamptz;
  end if;
end;
$$;

-- ---------- Laden (legt bei Bedarf an) ----------
create or replace function public.board_load(p_code text)
returns table (
  custom     jsonb,
  hidden     jsonb,
  members    jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  perform public.abendbrett_pruefe_code(p_code);
  v_hash := public.abendbrett_hash(p_code);

  insert into public.abendbrett_boards (code_hash)
  values (v_hash)
  on conflict (code_hash) do nothing;

  return query
  select b.custom, b.hidden, b.members, b.updated_at
  from public.abendbrett_boards b
  where b.code_hash = v_hash;
end;
$$;

-- ---------- Speichern mit Konflikterkennung ----------
create or replace function public.board_save(
  p_code     text,
  p_custom   jsonb,
  p_hidden   jsonb,
  p_based_on timestamptz
)
returns table (conflict boolean, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash    text;
  v_aktuell timestamptz;
  v_neu     timestamptz;
begin
  perform public.abendbrett_pruefe_code(p_code);
  v_hash := public.abendbrett_hash(p_code);

  if p_based_on is null then
    raise exception 'Schreiben ohne bekannten Ausgangsstand ist nicht erlaubt';
  end if;

  if jsonb_typeof(coalesce(p_custom, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_hidden, '[]'::jsonb)) <> 'array' then
    raise exception 'Ungültiges Format';
  end if;

  if jsonb_array_length(coalesce(p_custom, '[]'::jsonb)) > 500
     or jsonb_array_length(coalesce(p_hidden, '[]'::jsonb)) > 2000 then
    raise exception 'Zu viele Einträge';
  end if;

  -- Größenbremse: schützt vor dem Vollschreiben der Zeile.
  if pg_column_size(coalesce(p_custom, '[]'::jsonb)) > 512000 then
    raise exception 'Datensatz zu groß';
  end if;

  select b.updated_at into v_aktuell
  from public.abendbrett_boards b
  where b.code_hash = v_hash
  for update;

  if v_aktuell is null then
    raise exception 'Unbekannter Kosmos — bitte zuerst laden';
  end if;

  if v_aktuell > p_based_on then
    return query select true, v_aktuell;
    return;
  end if;

  update public.abendbrett_boards
     set custom     = coalesce(p_custom, '[]'::jsonb),
         hidden     = coalesce(p_hidden, '[]'::jsonb),
         updated_at = now()
   where code_hash = v_hash
  returning public.abendbrett_boards.updated_at into v_neu;

  return query select false, v_neu;
end;
$$;

-- ---------- Beitreten ----------
-- p_dry_run = true meldet nur, ob der Name bekannt ist, ohne etwas zu schreiben.
create or replace function public.board_join(
  p_code    text,
  p_name    text,
  p_dry_run boolean default false
)
returns table (members jsonb, bekannt boolean, seit text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash       text;
  v_name       text := left(trim(coalesce(p_name, '')), 60);
  v_jetzt      text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_mitglieder jsonb;
  v_gefunden   boolean := false;
  v_seit       text := null;
  v_eintrag    jsonb;
  v_neu        jsonb := '[]'::jsonb;
begin
  perform public.abendbrett_pruefe_code(p_code);
  v_hash := public.abendbrett_hash(p_code);

  if v_name = '' then
    raise exception 'Name fehlt';
  end if;

  if p_dry_run then
    select b.members into v_mitglieder
    from public.abendbrett_boards b
    where b.code_hash = v_hash;

    for v_eintrag in select * from jsonb_array_elements(coalesce(v_mitglieder, '[]'::jsonb))
    loop
      if lower(trim(v_eintrag->>'name')) = lower(v_name) then
        v_gefunden := true;
        v_seit := v_eintrag->>'seit';
      end if;
    end loop;

    return query select '[]'::jsonb, v_gefunden, v_seit;
    return;
  end if;

  insert into public.abendbrett_boards (code_hash)
  values (v_hash)
  on conflict (code_hash) do nothing;

  select b.members into v_mitglieder
  from public.abendbrett_boards b
  where b.code_hash = v_hash
  for update;                                  -- sperrt die Zeile: kein Wettlauf

  for v_eintrag in select * from jsonb_array_elements(coalesce(v_mitglieder, '[]'::jsonb))
  loop
    if lower(trim(v_eintrag->>'name')) = lower(v_name) then
      v_gefunden := true;
      v_seit := v_eintrag->>'seit';
      v_neu := v_neu || jsonb_build_array(jsonb_set(v_eintrag, '{zuletzt}', to_jsonb(v_jetzt)));
    else
      v_neu := v_neu || jsonb_build_array(v_eintrag);
    end if;
  end loop;

  if not v_gefunden then
    if jsonb_array_length(v_neu) >= 50 then
      raise exception 'Zu viele Mitglieder in diesem Kosmos';
    end if;
    v_neu := v_neu || jsonb_build_array(
      jsonb_build_object('name', v_name, 'seit', v_jetzt, 'zuletzt', v_jetzt)
    );
  end if;

  -- Bewusst OHNE updated_at anzufassen: ein Beitritt ist keine inhaltliche
  -- Änderung an den Gerichten. Vorher entwertete er den Ausgangsstand anderer
  -- Geräte und trieb deren ungespeicherte Änderungen in einen Konflikt.
  update public.abendbrett_boards
     set members = v_neu
   where code_hash = v_hash;

  return query select v_neu, v_gefunden, v_seit;
end;
$$;

-- ---------- Mitglied entfernen ----------
create or replace function public.board_remove_member(p_code text, p_name text)
returns table (members jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_neu  jsonb;
begin
  perform public.abendbrett_pruefe_code(p_code);
  v_hash := public.abendbrett_hash(p_code);

  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_neu
  from public.abendbrett_boards b,
       lateral jsonb_array_elements(b.members) e
  where b.code_hash = v_hash
    and lower(trim(e->>'name')) <> lower(trim(coalesce(p_name, '')));

  update public.abendbrett_boards
     set members = coalesce(v_neu, '[]'::jsonb)
   where code_hash = v_hash;

  return query select coalesce(v_neu, '[]'::jsonb);
end;
$$;

-- ---------- Rechte: nur die Funktionen, nicht die Tabelle ----------
-- Alte Signaturen aus Version 2 entfernen, sonst bleiben sie aufrufbar.
drop function if exists public.board_join(text, text);

revoke all on function public.board_peek(text)                                from public;
revoke all on function public.board_load(text)                                from public;
revoke all on function public.board_save(text, jsonb, jsonb, timestamptz)     from public;
revoke all on function public.board_join(text, text, boolean)                 from public;
revoke all on function public.board_remove_member(text, text)                 from public;

grant execute on function public.board_peek(text)                             to anon, authenticated;
grant execute on function public.board_load(text)                             to anon, authenticated;
grant execute on function public.board_save(text, jsonb, jsonb, timestamptz)  to anon, authenticated;
grant execute on function public.board_join(text, text, boolean)              to anon, authenticated;
grant execute on function public.board_remove_member(text, text)              to anon, authenticated;

-- ---------- Migration von Version 2 ----------
-- Version 2 hashte die Codes mit MD5 ohne Salz. Durch den Wechsel auf SHA-256
-- mit Salz liegen bestehende Kosmen unter ihrem alten Hash und werden nicht
-- mehr gefunden. Zwei Wege:
--   a) Neu anfangen:  delete from public.abendbrett_boards;
--   b) Umschlüsseln (nur solange die Klartext-Codes bekannt sind):
--      update public.abendbrett_boards
--         set code_hash = public.abendbrett_hash('euer-code-im-klartext')
--       where code_hash = md5('euer-code-im-klartext');
