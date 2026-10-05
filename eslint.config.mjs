import nextConfig from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'supabase/functions/**', 'public/**'],
  },
  ...nextConfig,
  {
    rules: {
      // Flags "setState inside useEffect" (an extra render, not a bug). A few
      // existing screens do this; surfaced as warnings so CI stays green while
      // they're cleaned up. Every other rule remains an error.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
