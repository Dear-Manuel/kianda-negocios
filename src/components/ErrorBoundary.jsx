import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro na app:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-night flex flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl mb-2">Algo correu mal</p>
          <p className="text-sm text-muted mb-6">Os teus dados estão guardados. Tenta recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gold text-night font-semibold px-5 py-3 rounded-xl text-sm"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
