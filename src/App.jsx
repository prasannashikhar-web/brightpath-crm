import { useState, useEffect } from 'react'
import { checkSupabaseConnection } from './lib/supabaseClient'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking',
    message: 'Testing connection to Supabase...'
  })

  useEffect(() => {
    let isMounted = true

    checkSupabaseConnection().then((res) => {
      if (!isMounted) return
      if (res.connected) {
        console.log('[BrightPath CRM] Supabase Connection: SUCCESS -', res.message)
        setConnectionStatus({ status: 'connected', message: res.message })
      } else {
        console.error('[BrightPath CRM] Supabase Connection: FAILED -', res.message)
        setConnectionStatus({ status: 'failed', message: res.message })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <section id="center">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '16px',
            backgroundColor:
              connectionStatus.status === 'connected'
                ? 'rgba(34, 197, 94, 0.15)'
                : connectionStatus.status === 'failed'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(234, 179, 8, 0.15)',
            color:
              connectionStatus.status === 'connected'
                ? '#16a34a'
                : connectionStatus.status === 'failed'
                ? '#dc2626'
                : '#ca8a04',
            border: `1px solid ${
              connectionStatus.status === 'connected'
                ? 'rgba(34, 197, 94, 0.3)'
                : connectionStatus.status === 'failed'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(234, 179, 8, 0.3)'
            }`
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                connectionStatus.status === 'connected'
                  ? '#16a34a'
                  : connectionStatus.status === 'failed'
                  ? '#dc2626'
                  : '#ca8a04'
            }}
          />
          {connectionStatus.status === 'connected' && 'Supabase Connected'}
          {connectionStatus.status === 'failed' && `Supabase Connection Failed: ${connectionStatus.message}`}
          {connectionStatus.status === 'checking' && 'Checking Supabase Connection...'}
        </div>
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
