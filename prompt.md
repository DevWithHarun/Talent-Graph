client:745 WebSocket connection to 'ws://localhost:3000/?token=PRztcDonP__U' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED

client:755 WebSocket connection to 'ws://localhost:3000/?token=PRztcDonP__U' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED
client:765 [vite] failed to connect to websocket.
your current setup:
  (browser) localhost:3000/ <--[HTTP]--> localhost:3000/ (server)
  (browser) localhost:3000/ <--[WebSocket (failing)]--> localhost:3000/ (server)
Check out your Vite / network configuration and https://vite.dev/config/server-options.html#server-hmr .
react-dom_client.js?v=2dbd407c:22165 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
The FetchEvent for "http://localhost:3000/src/app/landing-page.tsx" resulted in a network error response: the promise was resolved with an error response object.
landing-page.tsx:1 
 Failed to load resource: net::ERR_FAILED
react-dom_client.js?v=2dbd407c:7276 TypeError: Failed to fetch dynamically imported module: http://localhost:3000/src/app/landing-page.tsx

The above error occurred in one of your React components.

React will try to recreate this component tree from scratch using the error boundary you provided, DashboardErrorBoundary.
dashboard-error-boundary.tsx:52 [DashboardErrorBoundary] caught: Failed to fetch dynamically imported module: http://localhost:3000/src/app/landing-page.tsx
﻿
