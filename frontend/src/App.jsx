import React, { useState, useEffect } from 'react';
import keycloak from './keycloak';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [backendMessage, setBackendMessage] = useState('');
  const [initComplete, setInitComplete] = useState(false);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
      })
      .then((auth) => {
        setAuthenticated(auth);
        setInitComplete(true);
        if (auth) {
          setUserInfo({
            username: keycloak.tokenParsed?.preferred_username,
            email: keycloak.tokenParsed?.email,
            name: keycloak.tokenParsed?.name,
          });
          // Store token for API calls
          localStorage.setItem('kc_token', keycloak.token);
        }
      })
      .catch((err) => {
        console.error('Keycloak init error:', err);
        setInitComplete(true);
      });

    // Token refresh handler
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        setAuthenticated(false);
        setUserInfo(null);
      });
    };
  }, []);

  const handleLogin = () => {
    keycloak.login();
  };

  const handleLogout = () => {
    keycloak.logout();
  };

  const callBackend = async () => {
    try {
      const token = keycloak.token;
      const res = await fetch('http://localhost:8081/api/secure/hello', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBackendMessage(JSON.stringify(data, null, 2));
      } else {
        setBackendMessage(`Error ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      setBackendMessage(`Error: ${err.message}`);
    }
  };

  if (!initComplete) {
    return (
      <div style={styles.container}>
        <h1>2FA TOTP Demo</h1>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>🔐 2FA TOTP Demo</h1>
      <p style={styles.subtitle}>
        6-Digit TOTP enforced by Keycloak | Spring Boot WebFlux | React
      </p>

      <div style={styles.card}>
        <h2>Authentication Status</h2>
        {authenticated ? (
          <div>
            <p style={styles.success}>✅ Authenticated</p>
            {userInfo && (
              <div style={styles.info}>
                <p>
                  <strong>Username:</strong> {userInfo.username}
                </p>
                <p>
                  <strong>Email:</strong> {userInfo.email}
                </p>
                <p>
                  <strong>Name:</strong> {userInfo.name}
                </p>
              </div>
            )}
            <button style={styles.btnSuccess} onClick={callBackend}>
              Call Backend API
            </button>
            {backendMessage && (
              <pre style={styles.pre}>{backendMessage}</pre>
            )}
            <button style={styles.btnDanger} onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div>
            <p style={styles.warning}>⚠️ Not authenticated</p>
            <p>Login to access the backend API. TOTP 6-digit setup is required.</p>
            <button style={styles.btnPrimary} onClick={handleLogin}>
              Login with Keycloak
            </button>
          </div>
        )}
      </div>

      <div style={styles.infoBox}>
        <h3>Infrastructure</h3>
        <ul>
          <li>Keycloak: <a href="http://localhost:8080">localhost:8080</a></li>
          <li>Backend API: <a href="http://localhost:8081/actuator/health">localhost:8081</a></li>
          <li>Frontend: <a href="http://localhost:3000">localhost:3000</a></li>
          <li>Mailpit: <a href="http://localhost:8025">localhost:8025</a></li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 700,
    margin: '0 auto',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
    background: '#fafafa',
  },
  success: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warning: {
    color: '#e65100',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    background: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  pre: {
    background: '#263238',
    color: '#aed581',
    padding: 12,
    borderRadius: 4,
    overflow: 'auto',
    fontSize: 12,
    marginTop: 12,
  },
  btnPrimary: {
    padding: '10px 24px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    marginRight: 8,
  },
  btnSuccess: {
    padding: '10px 24px',
    background: '#388e3c',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    marginRight: 8,
  },
  btnDanger: {
    padding: '10px 24px',
    background: '#d32f2f',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    marginLeft: 8,
  },
  infoBox: {
    border: '1px solid #bbdefb',
    borderRadius: 8,
    padding: 16,
    background: '#e3f2fd',
  },
};

export default App;
