import { useState } from 'react'
import { authenticate } from '../utils/auth.js'

function LoginScreen({ onLogin }) {
  const baseUrl = import.meta.env.BASE_URL
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const account = authenticate(username, password)
    if (!account) {
      setError('Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.')
      return
    }
    setError('')
    onLogin(account)
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <img
            src={`${baseUrl}theme/assets/images/logo-icon.png`}
            alt="MEB Üretim Takip Sistemi"
            className="login-logo"
          />
          <span className="eyebrow">MEB Üretim Paneli</span>
          <h1>Üretim Takip Sistemi</h1>
          <p>Oyun ve simülasyon üretim akışını tek panelden yönetin. Devam etmek için kullanıcı bilgilerinizle giriş yapın.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
          <label className="login-field">
            <span>Kullanıcı Adı</span>
            <div className="login-input">
              <span className="material-icons-outlined" aria-hidden="true">person</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="ornek_kullanici"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoFocus
              />
            </div>
          </label>

          <label className="login-field">
            <span>Şifre</span>
            <div className="login-input">
              <span className="material-icons-outlined" aria-hidden="true">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="login-toggle-visibility"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <span className="material-icons-outlined" aria-hidden="true">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </label>

          {error ? (
            <div className="login-error" role="alert">
              <span className="material-icons-outlined" aria-hidden="true">error_outline</span>
              {error}
            </div>
          ) : null}

          <button type="submit" className="login-submit">
            <span>Giriş Yap</span>
            <span className="material-icons-outlined" aria-hidden="true">login</span>
          </button>

          <p className="login-footnote">
            Hesabınız yoksa sistem yöneticinizle iletişime geçin.
          </p>
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
