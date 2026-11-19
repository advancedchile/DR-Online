import React, { useState } from 'react';
import { GuideLang } from '../../data/helpGuideContent';
import {
  isFirebaseEmailAuthConfigured,
  loginAccountWithEmail,
  PortalAccount,
  registerAccountWithEmail,
  requestPasswordReset,
  sendVerificationEmail
} from '../../services/firebaseAuthClient';
import '../../styles/dr-portal.css';

type PortalView = 'home' | 'login' | 'register' | 'forgot' | 'account' | 'rules';

interface PortalAuthPageProps {
  lang: GuideLang;
  onChangeLang: (lang: GuideLang) => void;
  onOpenHelp: () => void;
  onEnterGame: (accountId: string) => void;
}

const GUIDE_LINKS = [
  { id: 'getting-started', en: 'Getting Started', es: 'Primeros Pasos' },
  { id: 'hotkeys', en: 'Hotkeys', es: 'Atajos de Teclado' },
  { id: 'commands', en: 'Commands', es: 'Comandos' },
  { id: 'classes', en: 'Classes', es: 'Clases' },
  { id: 'tactics', en: 'Tactics', es: 'Tácticas' },
  { id: 'job-system', en: 'Job System', es: 'Profesiones' },
  { id: 'pvp', en: 'PvP', es: 'PvP y Naciones' },
  { id: 'spells', en: 'Spells', es: 'Magia y Orison' },
  { id: 'combat-skills', en: 'Combat Skills', es: 'Habilidades de Combate' }
];

const NEWS_ITEMS = {
  en: [
    {
      title: 'Welcome to Dragon Raja Online — Browser Edition',
      category: 'announcement',
      date: '18 November 2026',
      author: 'DR-Online Team',
      body: `Dear Players,
Dragon Raja Online is now playable directly in your web browser with no client download required.
Create your account, verify your email address, and choose your nation when creating your first character inside the game.`
    },
    {
      title: 'HD Widescreen & Classic Combat Update',
      category: 'update',
      date: '15 November 2026',
      author: 'DR-Online Team',
      body: `Dear Players,
We have upgraded the native WebAssembly client to HD widescreen resolution (1344 × 768) and synchronized accounts and characters in real time with Firebase.`
    },
    {
      title: 'In-Game Bilingual Help Guide Available',
      category: 'guide',
      date: '12 November 2026',
      author: 'DR-Online Team',
      body: `Dear Players,
Click the HELP button at the top-left corner inside the game to open the new indexed and searchable Help Guide in both English and Spanish.`
    }
  ],
  es: [
    {
      title: 'Bienvenidos a Dragon Raja Online — Edición Navegador',
      category: 'anuncio',
      date: '18 de noviembre de 2026',
      author: 'Equipo DR-Online',
      body: `Estimados jugadores,
Dragon Raja Online ya se puede jugar directamente desde el navegador sin necesidad de descargar ningún cliente.
Crea tu cuenta, confirma tu correo electrónico desde tu bandeja de entrada y elige tu nación al crear tu primer personaje dentro del juego.`
    },
    {
      title: 'Actualización HD Panorámica y Combate Clásico',
      category: 'actualización',
      date: '15 de noviembre de 2026',
      author: 'Equipo DR-Online',
      body: `Estimados jugadores,
Actualizamos el cliente nativo WebAssembly a resolución panorámica HD (1344 × 768) y sincronizamos las cuentas y personajes en tiempo real con Firebase.`
    },
    {
      title: 'Nueva Guía de Ayuda Bilingüe dentro del Juego',
      category: 'guía',
      date: '12 de noviembre de 2026',
      author: 'Equipo DR-Online',
      body: `Estimados jugadores,
Haz clic en el botón HELP en la esquina superior izquierda dentro del juego para abrir la nueva Guía de Ayuda con índice, buscador y cambio de idioma entre español e inglés.`
    }
  ]
};

const TEXT = {
  en: {
    menu: 'Menu',
    navAccount: 'Account',
    navSignIn: 'Sign In',
    navCreateAccount: 'Create Account',
    navMyAccount: 'My Account',
    navSignOut: 'Sign Out',
    navGuide: 'Game Guide',
    navNews: 'News',
    navAllNews: 'All News',
    navLanguage: 'Language',
    homeTitle: 'Dragon Raja Online',
    homeSub: 'A 2D isometric, free-to-play MMORPG playable directly in your browser.',
    playBoxTitle: 'Play',
    playBoxDesc: 'Create an account, confirm your email and start playing directly in your browser.',
    playBoxCreate: 'Create an account',
    playBoxSignIn: 'Sign in to play',
    playBoxLaunch: 'Play in browser',
    loginTitle: 'Sign In',
    loginSub: 'Sign in to manage your game account.',
    usernameLabel: 'Username',
    usernameLoginHint: 'Your username (or email address).',
    passwordLabel: 'Password',
    signInBtn: 'Sign In',
    noAccountYet: 'No account yet?',
    createOne: 'Create one',
    forgotPasswordLink: 'Forgotten your password?',
    registerTitle: 'Create an Account',
    registerSub: 'Free to play. No download required. You will choose your nation when creating a character in game.',
    usernameRegHint: '4-14 letters, numbers or underscores. Pick carefully.',
    passwordRegHint: '6-20 characters. Use a strong password.',
    confirmPasswordLabel: 'Confirm password',
    secondaryPasswordLabel: 'Secondary password',
    secondaryPasswordHint: '4-20 characters. Used in game to protect your items and trades. It must differ from your password.',
    emailLabel: 'Email address',
    emailHint: 'We will send a confirmation link to this email to activate your account.',
    acceptRulesPrefix: 'I have read and accept the',
    rulesLink: 'rules',
    createAccountBtn: 'Create Account',
    alreadyRegistered: 'Already registered?',
    signInLink: 'Sign in',
    processing: 'Processing...',
    verificationTitle: 'Confirm your email address',
    verificationBody: (email: string) =>
      `We sent a confirmation email to ${email}. Open your inbox and click the verification link to activate your account before signing in.`,
    resendBtn: 'Resend confirmation email',
    resendSuccess: 'Confirmation email resent. Please check your inbox and spam folder.',
    goToSignIn: 'Go to Sign In',
    forgotTitle: 'Reset Password',
    forgotSub: 'Enter the email address registered to your account to receive a password reset link.',
    sendResetBtn: 'Send Reset Email',
    resetSentMsg: 'If an account exists for that email, a password reset link has been sent.',
    accountTitle: 'My Account',
    accountSub: 'Your email is verified and your account is ready to play.',
    accountCharacters: 'Characters',
    noCharacters: 'You have no characters yet. Launch the game to create your first character and choose your nation (Vyseus, Zypern, or Yllse).',
    rulesTitle: 'Server Rules',
    rulesSub: 'Please respect the community and play fairly.',
    rulesList: [
      'No cheating, bots, macros, or exploitation of bugs.',
      'Respect other players and staff at all times.',
      'Account sharing and real-money trading are not permitted.',
      'Each player chooses their nation inside the game when creating a character.'
    ],
    apiKeyMissingBanner:
      'Email verification requires VITE_FIREBASE_API_KEY in .env (and GitHub repository secrets) with Firebase Email/Password Authentication enabled.',
    footer: '© 2009–2026 Dragon Raja Online. All rights reserved.',
    errors: {
      INVALID_USERNAME: 'Username must be 4 to 14 characters (letters, numbers or _).',
      INVALID_EMAIL: 'Please enter a valid email address.',
      INVALID_PASSWORD: 'Password must be 6 to 20 characters.',
      PASSWORD_MISMATCH: 'Passwords do not match.',
      INVALID_SECONDARY_PASSWORD: 'Secondary password must be 4-20 characters and different from your password.',
      RULES_REQUIRED: 'You must accept the rules to create an account.',
      USERNAME_EXISTS: 'That username is already registered.',
      EMAIL_EXISTS: 'An account with that email address already exists.',
      EMAIL_AUTH_DISABLED: 'Email/Password sign-in is not enabled yet in Firebase Authentication.',
      FIREBASE_API_KEY_MISSING: 'Firebase Web API Key (VITE_FIREBASE_API_KEY) is not configured yet.',
      MISSING_CREDENTIALS: 'Please enter your username and password.',
      ACCOUNT_NOT_FOUND: 'Account not found.',
      WRONG_PASSWORD: 'Invalid username or password.',
      EMAIL_NOT_VERIFIED: 'Your email address is not verified yet. Please click the confirmation link we sent to your email.',
      TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait a few minutes and try again.',
      NETWORK_ERROR: 'Could not connect to authentication service. Please try again.'
    } as Record<string, string>
  },
  es: {
    menu: 'Menú',
    navAccount: 'Cuenta',
    navSignIn: 'Iniciar Sesión',
    navCreateAccount: 'Crear Cuenta',
    navMyAccount: 'Mi Cuenta',
    navSignOut: 'Cerrar Sesión',
    navGuide: 'Guía del Juego',
    navNews: 'Noticias',
    navAllNews: 'Todas las Noticias',
    navLanguage: 'Idioma',
    homeTitle: 'Dragon Raja Online',
    homeSub: 'MMORPG isométrico 2D gratuito, jugable directamente desde tu navegador.',
    playBoxTitle: 'Jugar',
    playBoxDesc: 'Crea una cuenta, confirma tu correo y comienza a jugar directo en tu navegador.',
    playBoxCreate: 'Crear una cuenta',
    playBoxSignIn: 'Iniciar sesión',
    playBoxLaunch: 'Jugar en el navegador',
    loginTitle: 'Iniciar Sesión',
    loginSub: 'Inicia sesión para administrar tu cuenta de juego.',
    usernameLabel: 'Usuario',
    usernameLoginHint: 'Tu nombre de usuario (o correo electrónico).',
    passwordLabel: 'Contraseña',
    signInBtn: 'Iniciar Sesión',
    noAccountYet: '¿Aún no tienes cuenta?',
    createOne: 'Crea una aquí',
    forgotPasswordLink: '¿Olvidaste tu contraseña?',
    registerTitle: 'Crear una Cuenta',
    registerSub: 'Gratis para jugar. Sin descargas. Elegirás tu nación al crear un personaje dentro del juego.',
    usernameRegHint: '4 a 14 letras, números o guion bajo (_). Elige con cuidado.',
    passwordRegHint: '6 a 20 caracteres. Usa una contraseña segura.',
    confirmPasswordLabel: 'Confirmar contraseña',
    secondaryPasswordLabel: 'Contraseña secundaria',
    secondaryPasswordHint: '4 a 20 caracteres. Se usa en el juego para proteger tus objetos y comercios. Debe ser distinta a tu contraseña.',
    emailLabel: 'Correo electrónico',
    emailHint: 'Te enviaremos un enlace de confirmación a este correo para activar tu cuenta.',
    acceptRulesPrefix: 'He leído y acepto las',
    rulesLink: 'reglas',
    createAccountBtn: 'Crear Cuenta',
    alreadyRegistered: '¿Ya estás registrado?',
    signInLink: 'Inicia sesión',
    processing: 'Procesando...',
    verificationTitle: 'Confirma tu correo electrónico',
    verificationBody: (email: string) =>
      `Enviamos un correo de confirmación a ${email}. Abre tu bandeja de entrada y haz clic en el enlace para activar tu cuenta antes de iniciar sesión.`,
    resendBtn: 'Reenviar correo de confirmación',
    resendSuccess: 'Correo de confirmación reenviado. Revisa tu bandeja de entrada y correo no deseado.',
    goToSignIn: 'Ir a Iniciar Sesión',
    forgotTitle: 'Recuperar Contraseña',
    forgotSub: 'Ingresa el correo electrónico de tu cuenta para recibir un enlace de recuperación.',
    sendResetBtn: 'Enviar Correo',
    resetSentMsg: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.',
    accountTitle: 'Mi Cuenta',
    accountSub: 'Tu correo está verificado y tu cuenta está lista para jugar.',
    accountCharacters: 'Personajes',
    noCharacters: 'Todavía no tienes personajes creados. Entra al juego para crear tu primer personaje y elegir tu nación (Vyseus, Zypern o Yllse).',
    rulesTitle: 'Reglas del Servidor',
    rulesSub: 'Respeta a la comunidad y juega de forma limpia.',
    rulesList: [
      'No se permiten cheats, bots, macros ni aprovechar errores del juego.',
      'Respeta siempre a los demás jugadores y al equipo del servidor.',
      'No está permitido compartir cuentas ni comerciar con dinero real.',
      'Cada jugador elige su nación dentro del juego al crear un personaje.'
    ],
    apiKeyMissingBanner:
      'Para enviar los correos reales de confirmación falta configurar VITE_FIREBASE_API_KEY en .env (y en los secrets de GitHub) y activar Correo electrónico/contraseña en Firebase Authentication.',
    footer: '© 2009–2026 Dragon Raja Online. Todos los derechos reservados.',
    errors: {
      INVALID_USERNAME: 'El usuario debe tener entre 4 y 14 caracteres (letras, números o _).',
      INVALID_EMAIL: 'Ingresa un correo electrónico válido.',
      INVALID_PASSWORD: 'La contraseña debe tener entre 6 y 20 caracteres.',
      PASSWORD_MISMATCH: 'Las contraseñas no coinciden.',
      INVALID_SECONDARY_PASSWORD: 'La contraseña secundaria debe tener entre 4 y 20 caracteres y ser distinta a la principal.',
      RULES_REQUIRED: 'Debes aceptar las reglas para crear una cuenta.',
      USERNAME_EXISTS: 'Ese nombre de usuario ya está registrado.',
      EMAIL_EXISTS: 'Ya existe una cuenta registrada con ese correo electrónico.',
      EMAIL_AUTH_DISABLED: 'El inicio de sesión con Correo/Contraseña aún no está activado en Firebase Authentication.',
      FIREBASE_API_KEY_MISSING: 'Falta configurar VITE_FIREBASE_API_KEY de Firebase.',
      MISSING_CREDENTIALS: 'Ingresa tu usuario y contraseña.',
      ACCOUNT_NOT_FOUND: 'No se encontró una cuenta con ese usuario.',
      WRONG_PASSWORD: 'Usuario o contraseña incorrectos.',
      EMAIL_NOT_VERIFIED: 'Tu correo aún no ha sido confirmado. Haz clic en el enlace que te enviamos a tu email.',
      TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
      NETWORK_ERROR: 'No se pudo conectar con el servicio de autenticación. Intenta nuevamente.'
    } as Record<string, string>
  }
};

export const PortalAuthPage: React.FC<PortalAuthPageProps> = ({
  lang,
  onChangeLang,
  onOpenHelp,
  onEnterGame
}) => {
  const t = TEXT[lang];
  const baseUrl = import.meta.env.BASE_URL || '/';
  const img = (name: string) => `${baseUrl}portal-images/${name}`;
  const isGitHubHosted =
    typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

  const [account, setAccount] = useState<PortalAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem('dr_portal_account');
      return saved ? (JSON.parse(saved) as PortalAccount) : null;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState<PortalView>(account ? 'account' : 'home');

  // Login form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form (no nation selector — chosen in-game on character creation)
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regSecPass, setRegSecPass] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Email verification state
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [pendingVerifyToken, setPendingVerifyToken] = useState<string | null>(null);
  const [resendDone, setResendDone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const switchView = (next: PortalView) => {
    setView(next);
    setErrorCode(null);
    setResendDone(false);
    setForgotSent(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setResendDone(false);

    if (regPass !== regPassConfirm) {
      setErrorCode('PASSWORD_MISMATCH');
      return;
    }
    if (!regTerms) {
      setErrorCode('RULES_REQUIRED');
      return;
    }

    setLoading(true);
    const res = await registerAccountWithEmail({
      username: regUser,
      email: regEmail,
      password: regPass,
      secondaryPassword: regSecPass
    });
    setLoading(false);

    if (!res.ok) {
      setErrorCode(res.error || 'NETWORK_ERROR');
      return;
    }

    setPendingVerifyEmail(res.email || regEmail.trim());
    setPendingVerifyToken(res.idToken || null);
    setRegPass('');
    setRegPassConfirm('');
    setRegSecPass('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setResendDone(false);
    setLoading(true);

    const res = await loginAccountWithEmail(loginUser, loginPass);
    setLoading(false);

    if (!res.ok) {
      setErrorCode(res.error || 'WRONG_PASSWORD');
      if (res.error === 'EMAIL_NOT_VERIFIED' && res.idToken) {
        setPendingVerifyToken(res.idToken);
        setPendingVerifyEmail(res.email || null);
      }
      return;
    }

    if (res.account) {
      setAccount(res.account);
      try {
        sessionStorage.setItem('dr_portal_account', JSON.stringify(res.account));
      } catch {
        // ignore
      }
      setLoginPass('');
      setPendingVerifyEmail(null);
      setPendingVerifyToken(null);
      setView('account');
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerifyToken) return;
    setLoading(true);
    setErrorCode(null);
    const res = await sendVerificationEmail(pendingVerifyToken);
    setLoading(false);
    if (!res.ok) {
      setErrorCode(res.error || 'NETWORK_ERROR');
    } else {
      setResendDone(true);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);
    setLoading(true);
    const res = await requestPasswordReset(forgotEmail);
    setLoading(false);
    if (!res.ok) {
      setErrorCode(res.error || 'NETWORK_ERROR');
    } else {
      setForgotSent(true);
    }
  };

  const handleSignOut = () => {
    setAccount(null);
    try {
      sessionStorage.removeItem('dr_portal_account');
    } catch {
      // ignore
    }
    switchView('home');
  };

  const renderNavSections = () => (
    <>
      <div style={{ marginBottom: 12 }}>
        <h2 className="dr-portal-nav-title">{t.navAccount}</h2>
        <ul className="dr-portal-nav-list">
          {account ? (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => switchView('account')}
                  className={`dr-portal-nav-btn${view === 'account' ? ' active' : ''}`}
                >
                  {t.navMyAccount} ({account.id})
                </button>
              </li>
              <li>
                <button type="button" onClick={handleSignOut} className="dr-portal-nav-btn">
                  {t.navSignOut}
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className={`dr-portal-nav-btn${view === 'login' ? ' active' : ''}`}
                >
                  {t.navSignIn}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerifyEmail(null);
                    switchView('register');
                  }}
                  className={`dr-portal-nav-btn${view === 'register' ? ' active' : ''}`}
                >
                  {t.navCreateAccount}
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h2 className="dr-portal-nav-title">{t.navGuide}</h2>
        <ul className="dr-portal-nav-list">
          {GUIDE_LINKS.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={onOpenHelp} className="dr-portal-nav-btn">
                {lang === 'es' ? item.es : item.en}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h2 className="dr-portal-nav-title">{t.navNews}</h2>
        <ul className="dr-portal-nav-list">
          <li>
            <button
              type="button"
              onClick={() => switchView('home')}
              className={`dr-portal-nav-btn${view === 'home' ? ' active' : ''}`}
            >
              {t.navAllNews}
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="dr-portal-nav-title">{t.navLanguage}</h2>
        <div style={{ display: 'flex', gap: 6, padding: '6px 8px 2px' }}>
          <button
            type="button"
            onClick={() => onChangeLang('es')}
            className="dr-portal-link"
            style={{
              fontSize: 12,
              fontWeight: lang === 'es' ? 700 : 400,
              color: lang === 'es' ? '#ffe742' : '#96814a'
            }}
          >
            Español
          </button>
          <span style={{ color: '#3e2a0c' }}>|</span>
          <button
            type="button"
            onClick={() => onChangeLang('en')}
            className="dr-portal-link"
            style={{
              fontSize: 12,
              fontWeight: lang === 'en' ? 700 : 400,
              color: lang === 'en' ? '#ffe742' : '#96814a'
            }}
          >
            English
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="dr-portal-root"
      style={{
        backgroundImage: `url('${img('background.png')}')`
      }}
    >
      {/* Original Header Banner */}
      <header>
        <div className="dr-portal-container">
          <button
            type="button"
            onClick={() => switchView('home')}
            style={{
              display: 'block',
              width: '100%',
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            <img
              src={img('header.png')}
              alt="Dragon Raja Online"
              style={{ width: '100%', display: 'block' }}
            />
          </button>
        </div>
      </header>

      {/* Original 3-Column Grid (170px | 1fr | 170px) */}
      <div className="dr-portal-grid">
        {/* Left Navigation (Mobile collapsible + Desktop panel) */}
        <nav aria-label="Site" style={{ display: 'contents' }}>
          <details className="dr-portal-nav-mobile">
            <summary
              className="dr-portal-font-display"
              style={{
                cursor: 'pointer',
                padding: '8px 16px',
                fontSize: 14,
                letterSpacing: '0.05em',
                color: '#e7c95e',
                textTransform: 'uppercase'
              }}
            >
              {t.menu}
            </summary>
            <div style={{ padding: '0 8px 8px' }}>{renderNavSections()}</div>
          </details>

          <div
            className="dr-portal-nav-desktop"
            style={{
              backgroundImage: `url('${img('background_nav_middle.png')}')`
            }}
          >
            {renderNavSections()}
          </div>
        </nav>

        {/* Center Main Content */}
        <main id="main" style={{ minWidth: 0 }}>
          {!isFirebaseEmailAuthConfigured() && (view === 'login' || view === 'register' || view === 'forgot') && (
            <div
              style={{
                marginBottom: 14,
                border: '1px solid #a97f22',
                backgroundColor: '#1c0f00',
                padding: '10px 14px',
                fontSize: 12.5,
                color: '#e7c95e',
                lineHeight: 1.5
              }}
            >
              {t.apiKeyMissingBanner}
            </div>
          )}

          {/* HOME / NEWS VIEW */}
          {view === 'home' && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{
                    margin: 0,
                    fontSize: 20,
                    letterSpacing: '0.04em',
                    color: '#e7c95e',
                    fontWeight: 500
                  }}
                >
                  {t.homeTitle}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.homeSub}</p>
              </div>

              {NEWS_ITEMS[lang].map((news, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <article style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'baseline',
                        gap: 8,
                        borderBottom: '1px solid #3e2a0c',
                        backgroundColor: '#0e0300',
                        padding: '8px 16px'
                      }}
                    >
                      <h3
                        className="dr-portal-font-display"
                        style={{ margin: 0, fontSize: 16, color: '#e7c95e', fontWeight: 500 }}
                      >
                        {news.title}
                      </h3>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          color: '#a97f22',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {news.category}
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.55,
                          whiteSpace: 'pre-line',
                          color: '#96814a'
                        }}
                      >
                        {news.body}
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#a97f22' }}>
                        {news.date} · {news.author}
                      </p>
                    </div>
                  </article>
                </div>
              ))}
            </>
          )}

          {/* SIGN IN VIEW */}
          {view === 'login' && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{ margin: 0, fontSize: 20, letterSpacing: '0.04em', color: '#e7c95e', fontWeight: 500 }}
                >
                  {t.loginTitle}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.loginSub}</p>
              </div>

              <div style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00', padding: '14px 16px' }}>
                <form onSubmit={handleLogin} style={{ maxWidth: 448 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      htmlFor="login_id"
                      style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                    >
                      {t.usernameLabel}
                    </label>
                    <input
                      id="login_id"
                      type="text"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      autoComplete="username"
                      maxLength={50}
                      required
                      className="dr-portal-input"
                    />
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a97f22' }}>{t.usernameLoginHint}</p>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      htmlFor="login_password"
                      style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                    >
                      {t.passwordLabel}
                    </label>
                    <input
                      id="login_password"
                      type="password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      autoComplete="current-password"
                      maxLength={20}
                      required
                      className="dr-portal-input"
                    />
                  </div>

                  {errorCode && (
                    <div
                      style={{
                        marginBottom: 12,
                        border: '1px solid #e05a2b',
                        backgroundColor: '#1e0904',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: '#f2a58a'
                      }}
                    >
                      <div>{t.errors[errorCode] || errorCode}</div>
                      {errorCode === 'EMAIL_NOT_VERIFIED' && pendingVerifyToken && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={loading}
                          className="dr-portal-link"
                          style={{ marginTop: 6, fontSize: 12.5, textDecoration: 'underline' }}
                        >
                          {t.resendBtn}
                        </button>
                      )}
                    </div>
                  )}

                  {resendDone && (
                    <div
                      style={{
                        marginBottom: 12,
                        border: '1px solid #31af00',
                        backgroundColor: '#0c1c05',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: '#9ee880'
                      }}
                    >
                      {t.resendSuccess}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="dr-portal-submit">
                    {loading ? t.processing : t.signInBtn}
                  </button>
                </form>

                <p style={{ margin: '16px 0 0', fontSize: 14 }}>
                  {t.noAccountYet}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setPendingVerifyEmail(null);
                      switchView('register');
                    }}
                    className="dr-portal-link"
                  >
                    {t.createOne}
                  </button>
                  .
                </p>

                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, fontSize: 14 }}>
                  <li>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="dr-portal-link"
                    >
                      {t.forgotPasswordLink}
                    </button>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* CREATE ACCOUNT VIEW (NO NATION SELECTOR + REAL EMAIL VERIFICATION) */}
          {view === 'register' && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{ margin: 0, fontSize: 20, letterSpacing: '0.04em', color: '#e7c95e', fontWeight: 500 }}
                >
                  {t.registerTitle}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.registerSub}</p>
              </div>

              <div style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00', padding: '14px 16px' }}>
                {pendingVerifyEmail ? (
                  <div style={{ maxWidth: 520 }}>
                    <h2
                      className="dr-portal-font-display"
                      style={{ margin: '0 0 8px', fontSize: 17, color: '#e7c95e' }}
                    >
                      {t.verificationTitle}
                    </h2>
                    <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.55, color: '#96814a' }}>
                      {t.verificationBody(pendingVerifyEmail)}
                    </p>

                    {resendDone && (
                      <div
                        style={{
                          marginBottom: 12,
                          border: '1px solid #31af00',
                          backgroundColor: '#0c1c05',
                          padding: '8px 12px',
                          fontSize: 13,
                          color: '#9ee880'
                        }}
                      >
                        {t.resendSuccess}
                      </div>
                    )}

                    {errorCode && (
                      <div
                        style={{
                          marginBottom: 12,
                          border: '1px solid #e05a2b',
                          backgroundColor: '#1e0904',
                          padding: '8px 12px',
                          fontSize: 13,
                          color: '#f2a58a'
                        }}
                      >
                        {t.errors[errorCode] || errorCode}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="dr-portal-submit"
                      >
                        {t.goToSignIn}
                      </button>
                      {pendingVerifyToken && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={loading}
                          className="dr-portal-submit"
                          style={{ borderColor: '#3e2a0c', color: '#96814a' }}
                        >
                          {t.resendBtn}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleRegister} style={{ maxWidth: 448 }}>
                      <div style={{ marginBottom: 12 }}>
                        <label
                          htmlFor="reg_username"
                          style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                        >
                          {t.usernameLabel}
                        </label>
                        <input
                          id="reg_username"
                          type="text"
                          value={regUser}
                          onChange={(e) => setRegUser(e.target.value)}
                          autoComplete="username"
                          maxLength={14}
                          required
                          className="dr-portal-input"
                        />
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a97f22' }}>{t.usernameRegHint}</p>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          htmlFor="reg_password"
                          style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                        >
                          {t.passwordLabel}
                        </label>
                        <input
                          id="reg_password"
                          type="password"
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                          autoComplete="new-password"
                          maxLength={20}
                          required
                          className="dr-portal-input"
                        />
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a97f22' }}>{t.passwordRegHint}</p>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          htmlFor="reg_password_confirm"
                          style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                        >
                          {t.confirmPasswordLabel}
                        </label>
                        <input
                          id="reg_password_confirm"
                          type="password"
                          value={regPassConfirm}
                          onChange={(e) => setRegPassConfirm(e.target.value)}
                          autoComplete="new-password"
                          maxLength={20}
                          required
                          className="dr-portal-input"
                        />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          htmlFor="reg_sec_password"
                          style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                        >
                          {t.secondaryPasswordLabel}
                        </label>
                        <input
                          id="reg_sec_password"
                          type="password"
                          value={regSecPass}
                          onChange={(e) => setRegSecPass(e.target.value)}
                          maxLength={20}
                          required
                          className="dr-portal-input"
                        />
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a97f22' }}>
                          {t.secondaryPasswordHint}
                        </p>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          htmlFor="reg_email"
                          style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                        >
                          {t.emailLabel}
                        </label>
                        <input
                          id="reg_email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          autoComplete="email"
                          maxLength={60}
                          required
                          className="dr-portal-input"
                        />
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a97f22' }}>{t.emailHint}</p>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            fontSize: 14,
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={regTerms}
                            onChange={(e) => setRegTerms(e.target.checked)}
                            style={{ marginTop: 3 }}
                          />
                          <span>
                            {t.acceptRulesPrefix}{' '}
                            <button
                              type="button"
                              onClick={() => switchView('rules')}
                              className="dr-portal-link"
                            >
                              {t.rulesLink}
                            </button>
                            .
                          </span>
                        </label>
                      </div>

                      {errorCode && (
                        <div
                          style={{
                            marginBottom: 12,
                            border: '1px solid #e05a2b',
                            backgroundColor: '#1e0904',
                            padding: '8px 12px',
                            fontSize: 13,
                            color: '#f2a58a'
                          }}
                        >
                          {t.errors[errorCode] || errorCode}
                        </div>
                      )}

                      <button type="submit" disabled={loading} className="dr-portal-submit">
                        {loading ? t.processing : t.createAccountBtn}
                      </button>
                    </form>

                    <p style={{ margin: '16px 0 0', fontSize: 14 }}>
                      {t.alreadyRegistered}{' '}
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="dr-portal-link"
                      >
                        {t.signInLink}
                      </button>
                      .
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{ margin: 0, fontSize: 20, letterSpacing: '0.04em', color: '#e7c95e', fontWeight: 500 }}
                >
                  {t.forgotTitle}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.forgotSub}</p>
              </div>

              <div style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00', padding: '14px 16px' }}>
                <form onSubmit={handleForgot} style={{ maxWidth: 448 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      htmlFor="forgot_email"
                      style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#e7c95e' }}
                    >
                      {t.emailLabel}
                    </label>
                    <input
                      id="forgot_email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="dr-portal-input"
                    />
                  </div>

                  {forgotSent && (
                    <div
                      style={{
                        marginBottom: 12,
                        border: '1px solid #31af00',
                        backgroundColor: '#0c1c05',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: '#9ee880'
                      }}
                    >
                      {t.resetSentMsg}
                    </div>
                  )}

                  {errorCode && (
                    <div
                      style={{
                        marginBottom: 12,
                        border: '1px solid #e05a2b',
                        backgroundColor: '#1e0904',
                        padding: '8px 12px',
                        fontSize: 13,
                        color: '#f2a58a'
                      }}
                    >
                      {t.errors[errorCode] || errorCode}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="dr-portal-submit">
                    {loading ? t.processing : t.sendResetBtn}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* RULES VIEW */}
          {view === 'rules' && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{ margin: 0, fontSize: 20, letterSpacing: '0.04em', color: '#e7c95e', fontWeight: 500 }}
                >
                  {t.rulesTitle}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.rulesSub}</p>
              </div>
              <div style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00', padding: '14px 16px' }}>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
                  {t.rulesList.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ACCOUNT DASHBOARD VIEW */}
          {view === 'account' && account && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  border: '1px solid #3e2a0c',
                  backgroundColor: '#1c0f00',
                  padding: '12px 16px'
                }}
              >
                <h1
                  className="dr-portal-font-display"
                  style={{ margin: 0, fontSize: 20, letterSpacing: '0.04em', color: '#e7c95e', fontWeight: 500 }}
                >
                  {t.accountTitle}: {account.id}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#96814a' }}>{t.accountSub}</p>
              </div>

              <div style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00', padding: '14px 16px' }}>
                <div style={{ marginBottom: 14, fontSize: 14 }}>
                  <div>
                    <span style={{ color: '#a97f22' }}>{t.usernameLabel}: </span>
                    <strong style={{ color: '#e7c95e' }}>{account.id}</strong>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: '#a97f22' }}>{t.emailLabel}: </span>
                    <span>{account.email}</span>
                  </div>
                </div>

                <h2
                  className="dr-portal-font-display"
                  style={{
                    margin: '0 0 8px',
                    paddingBottom: 4,
                    borderBottom: '1px solid #3e2a0c',
                    fontSize: 14,
                    color: '#e7c95e',
                    textTransform: 'uppercase'
                  }}
                >
                  {t.accountCharacters} ({account.characters.length}/4)
                </h2>

                {account.characters.length === 0 ? (
                  <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.5 }}>{t.noCharacters}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {account.characters.map((ch) => (
                      <div
                        key={ch.name}
                        style={{
                          border: '1px solid #3e2a0c',
                          backgroundColor: '#0e0300',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13.5
                        }}
                      >
                        <span>
                          <strong style={{ color: '#e7c95e' }}>{ch.name}</strong> ({ch.className})
                        </span>
                        <span style={{ color: '#a97f22' }}>
                          Lv.{ch.level} · {ch.mapName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {!isGitHubHosted && (
                    <button
                      type="button"
                      onClick={() => onEnterGame(account.id)}
                      className="dr-portal-submit"
                    >
                      {t.playBoxLaunch}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="dr-portal-submit"
                    style={{ borderColor: '#3e2a0c', color: '#96814a' }}
                  >
                    {t.navSignOut}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar: Original PLAY Box (NO Download Link!) */}
        <aside className="dr-portal-aside" aria-label="More">
          <section style={{ border: '1px solid #3e2a0c', backgroundColor: '#180c00' }} aria-label="Play">
            <h2
              className="dr-portal-font-display"
              style={{
                margin: 0,
                borderBottom: '1px solid #3e2a0c',
                backgroundColor: '#0e0300',
                padding: '8px 16px',
                fontSize: 14,
                letterSpacing: '0.05em',
                color: '#e7c95e',
                textTransform: 'uppercase',
                fontWeight: 500
              }}
            >
              {t.playBoxTitle}
            </h2>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.45 }}>{t.playBoxDesc}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 14, lineHeight: 1.7 }}>
                {!account && (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingVerifyEmail(null);
                          switchView('register');
                        }}
                        className="dr-portal-link"
                      >
                        {t.playBoxCreate}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="dr-portal-link"
                      >
                        {t.playBoxSignIn}
                      </button>
                    </li>
                  </>
                )}
                {!isGitHubHosted && (
                  <li>
                    <button
                      type="button"
                      onClick={() => onEnterGame(account?.id || '')}
                      className="dr-portal-link"
                    >
                      {t.playBoxLaunch}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </aside>
      </div>

      {/* Original Footer */}
      <footer
        className="dr-portal-footer"
        style={{
          backgroundImage: `url('${img('background_footer.png')}')`
        }}
      >
        <div
          className="dr-portal-container"
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            fontSize: 12,
            color: '#96814a'
          }}
        >
          {t.footer}
        </div>
      </footer>
    </div>
  );
};
