import { Component } from "react";

/**
 * Fängt Render-Fehler ab, statt die Seite weiß werden zu lassen.
 * Genau dieser Fall war in der Vorversion möglich: ein Gericht ohne
 * `zutaten`-Array riss beim Rendern die ganze App mit.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fehler: null };
  }

  static getDerivedStateFromError(fehler) {
    return { fehler };
  }

  componentDidCatch(fehler, info) {
    console.error("Abendbrett: unerwarteter Fehler", fehler, info);
  }

  render() {
    if (!this.state.fehler) return this.props.children;
    return (
      <div className="ab-root">
        <div className="ab-wrap" style={{ maxWidth: 520 }}>
          <div className="ab-panel" style={{ marginTop: 60 }}>
            <h1 className="ab-title" style={{ fontSize: 22 }}>Da ist etwas schiefgelaufen</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              Die Ansicht konnte nicht aufgebaut werden. Die gespeicherten Gerichte
              sind nicht verloren — ein Neuladen genügt meistens.
            </p>
            <div className="ab-actions">
              <button className="ab-mini" onClick={() => window.location.reload()}>
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
