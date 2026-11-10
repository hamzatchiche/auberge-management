import { useEffect, useState } from 'react';
import { read } from '../services/mock';

export function useMockData() {
  const [, refresh] = useState(0);

  useEffect(() => {
    const handleChange = () => refresh((current) => current + 1);
    window.addEventListener('auberge-change', handleChange);
    return () => window.removeEventListener('auberge-change', handleChange);
  }, []);

  return read();
}
