'use client';

import { useEffect, useState } from 'react';

export function HealthDot() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setHealthy(res.ok))
      .catch(() => setHealthy(false));
  }, []);

  if (healthy === null) return null;

  return (
    <div
      className="fixed bottom-2 left-2 z-50"
      title={healthy ? 'System online' : 'System offline'}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          healthy ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
    </div>
  );
}
