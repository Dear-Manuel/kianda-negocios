import { useEffect, useState } from 'react';

// Incrementa sempre que store.js grava algo, para as telas re-calcularem
// os seus useMemo sem precisar de prop-drilling manual de "refreshKey".
export function useLiveVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((n) => n + 1);
    window.addEventListener('kianda:changed', bump);
    return () => window.removeEventListener('kianda:changed', bump);
  }, []);
  return v;
}
