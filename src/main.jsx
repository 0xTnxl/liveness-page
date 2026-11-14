import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@aws-amplify/ui-react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react/styles.css';

// The app passes { session_id, region, credentials } in the URL fragment, which is never sent to a
// server. Results go back through the Flutter JS channel `ZendLiveness`.
function post(msg) {
  try {
    window.ZendLiveness.postMessage(msg);
  } catch (_) {}
}

function readPayload() {
  try {
    const b64 = location.hash.slice(1).replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
    );
    history.replaceState(null, '', location.pathname);
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

const payload = readPayload();

function App() {
  if (!payload || !payload.session_id || !payload.credentials) {
    post('error');
    return <div className="msg">That didn't go through. Try again.</div>;
  }
  const c = payload.credentials;
  return (
    <ThemeProvider>
      <FaceLivenessDetector
        sessionId={payload.session_id}
        region={payload.region}
        onAnalysisComplete={() => post('done')}
        onUserCancel={() => post('cancel')}
        onError={() => post('error')}
        displayText={{ photosensitivyWarningHeadingText: 'Photosensitivity warning' }}
        config={{
          credentialProvider: async () => ({
            accessKeyId: c.access_key_id,
            secretAccessKey: c.secret_access_key,
            sessionToken: c.session_token,
            expiration: new Date(c.expiration * 1000),
          }),
        }}
      />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
