export const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3025';

// The JTL platform API, called directly from the browser by the serverless demo. `npm run register`
// writes VITE_JTL_API_BASE for the target environment; the fallback is production.
export const jtlApiUrl = import.meta.env.VITE_JTL_API_BASE || 'https://api.jtl-cloud.com';
