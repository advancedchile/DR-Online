import React, { useEffect, useRef, useState } from 'react';
import { GuideLang } from './data/helpGuideContent';
import { HelpGuideModal } from './ui/windows/HelpGuideModal';
import { PortalAuthPage } from './ui/screens/PortalAuthPage';

declare global {
  interface Window {
    Module?: any;
    DR_API_BASE?: string;
  }
}

const CODE_TO_DIK: Record<string, number> = {
  Escape: 0x01,
  Digit1: 0x02,
  Digit2: 0x03,
  Digit3: 0x04,
  Digit4: 0x05,
  Digit5: 0x06,
  Digit6: 0x07,
  Digit7: 0x08,
  Digit8: 0x09,
  Digit9: 0x0a,
  Digit0: 0x0b,
  Minus: 0x0c,
  Equal: 0x0d,
  Backspace: 0x0e,
  Tab: 0x0f,
  KeyQ: 0x10,
  KeyW: 0x11,
  KeyE: 0x12,
  KeyR: 0x13,
  KeyT: 0x14,
  KeyY: 0x15,
  KeyU: 0x16,
  KeyI: 0x17,
  KeyO: 0x18,
  KeyP: 0x19,
  BracketLeft: 0x1a,
  BracketRight: 0x1b,
  Enter: 0x1c,
  NumpadEnter: 0x9c,
  ControlLeft: 0x1d,
  ControlRight: 0x9d,
  KeyA: 0x1e,
  KeyS: 0x1f,
  KeyD: 0x20,
  KeyF: 0x21,
  KeyG: 0x22,
  KeyH: 0x23,
  KeyJ: 0x24,
  KeyK: 0x25,
  KeyL: 0x26,
  Semicolon: 0x27,
  Quote: 0x28,
  Backquote: 0x29,
  ShiftLeft: 0x2a,
  Backslash: 0x2b,
  KeyZ: 0x2c,
  KeyX: 0x2d,
  KeyC: 0x2e,
  KeyV: 0x2f,
  KeyB: 0x30,
  KeyN: 0x31,
  KeyM: 0x32,
  Comma: 0x33,
  Period: 0x34,
  Slash: 0x35,
  ShiftRight: 0x36,
  NumpadMultiply: 0x37,
  AltLeft: 0x38,
  AltRight: 0xb8,
  Space: 0x39,
  CapsLock: 0x3a,
  F1: 0x3b,
  F2: 0x3c,
  F3: 0x3d,
  F4: 0x3e,
  F5: 0x3f,
  F6: 0x40,
  F7: 0x41,
  F8: 0x42,
  F9: 0x43,
  F10: 0x44,
  F11: 0x57,
  F12: 0x58,
  Home: 0xc7,
  ArrowUp: 0xc8,
  PageUp: 0xc9,
  ArrowLeft: 0xcb,
  ArrowRight: 0xcd,
  End: 0xcf,
  ArrowDown: 0xd0,
  PageDown: 0xd1,
  Insert: 0xd2,
  Delete: 0xd3
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'portal' | 'game'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('play') === '1' ? 'game' : 'portal';
    } catch {
      return 'portal';
    }
  });
  const [lang, setLang] = useState<GuideLang>(() => {
    try {
      const saved = localStorage.getItem('dr_ui_lang');
      return saved === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const helpOpenRef = useRef<boolean>(false);
  const [status, setStatus] = useState<string>(
    lang === 'es'
      ? 'Cargando Dragon Raja Online...'
      : 'Loading Dragon Raja Online...'
  );
  const [fps, setFps] = useState<number | null>(null);

  const handleChangeLang = (nextLang: GuideLang) => {
    setLang(nextLang);
    try {
      localStorage.setItem('dr_ui_lang', nextLang);
    } catch {
      // ignore
    }
  };

  const handleLaunchGameTab = () => {
    const gameUrl = `${window.location.origin}${window.location.pathname}?play=1`;
    const opened = window.open(gameUrl, '_blank', 'noopener');
    if (!opened) {
      setMode('game');
    }
  };

  useEffect(() => {
    helpOpenRef.current = helpOpen;
  }, [helpOpen]);

  useEffect(() => {
    const onOpenHelp = () => setHelpOpen(true);
    const onFirstFrame = () => setStatus('');
    const onFpsUpdate = (e: Event) => {
      const val = (e as CustomEvent<number>).detail;
      if (typeof val === 'number' && !Number.isNaN(val)) {
        setFps(val);
      }
    };
    window.addEventListener('dr-open-help', onOpenHelp);
    window.addEventListener('dr-first-frame', onFirstFrame);
    window.addEventListener('dr-fps-update', onFpsUpdate);
    return () => {
      window.removeEventListener('dr-open-help', onOpenHelp);
      window.removeEventListener('dr-first-frame', onFirstFrame);
      window.removeEventListener('dr-fps-update', onFpsUpdate);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'game') return;
    let mounted = true;

    if (!window.Module) {
      const cacheBust = Date.now();
      const baseUrl = import.meta.env.BASE_URL || '/';
      const configuredServer = ((import.meta.env.VITE_GAME_SERVER_URL as string | undefined) || '')
        .trim()
        .replace(/\/+$/, '');
      if (configuredServer) {
        window.DR_API_BASE = configuredServer;
      }
      window.Module = {
        canvas: canvasRef.current,
        locateFile: (file: string) => `${baseUrl}wasm/${file}?v=${cacheBust}`,
        print: (text: string) => {
          console.log('[DR-WASM]', text);
        },
        printErr: (text: string) => {
          console.warn('[DR-WASM]', text);
        },
        onRuntimeInitialized: () => {
          if (mounted) {
            setStatus(
              lang === 'es'
                ? 'Conectando al servidor y cargando gráficos...'
                : 'Connecting to server and loading game assets...'
            );
          }
        }
      };

      const script = document.createElement('script');
      script.src = `${baseUrl}wasm/dragonraja.js?v=${cacheBust}`;
      script.async = true;
      script.onload = () => {
        if (mounted) {
          setStatus(
            lang === 'es'
              ? 'Iniciando motor gráfico...'
              : 'Starting game engine...'
          );
        }
      };
      script.onerror = () => {
        if (mounted) setStatus(`Failed to load ${baseUrl}wasm/dragonraja.js`);
      };
      document.body.appendChild(script);
    } else {
      setStatus('');
    }

    const getCanvasCoords = (e: MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const cw = canvas.width || 800;
      const ch = canvas.height || 600;
      const rect = canvas.getBoundingClientRect();
      const scaleX = cw / (rect.width || cw);
      const scaleY = ch / (rect.height || ch);
      const x = Math.max(0, Math.min(cw - 1, Math.floor((e.clientX - rect.left) * scaleX)));
      const y = Math.max(0, Math.min(ch - 1, Math.floor((e.clientY - rect.top) * scaleY)));
      return { x, y };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (helpOpenRef.current) return;
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_key_event !== 'function') return;

      // Prevent browser shortcuts for Tab, Backspace, F1-F12, Alt, Space, Arrows
      if (
        e.key === 'Tab' ||
        e.key === 'Backspace' ||
        e.key === 'Alt' ||
        e.key.startsWith('Arrow') ||
        (e.key.startsWith('F') && e.key.length <= 3 && e.key !== 'F5' && e.key !== 'F12')
      ) {
        e.preventDefault();
      }

      const vk = e.keyCode || e.which || 0;
      const dik = CODE_TO_DIK[e.code] || 0;
      mod._wasm_on_key_event(vk, dik, 1);

      if (typeof mod._wasm_on_char_event === 'function') {
        if (e.key === 'Backspace') {
          mod._wasm_on_char_event(8);
        } else if (e.key === 'Tab') {
          mod._wasm_on_char_event(9);
        } else if (e.key === 'Enter') {
          mod._wasm_on_char_event(13);
        } else if (e.key === 'Escape') {
          mod._wasm_on_char_event(27);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          mod._wasm_on_char_event(e.key.charCodeAt(0));
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (helpOpenRef.current) return;
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_key_event !== 'function') return;
      const vk = e.keyCode || e.which || 0;
      const dik = CODE_TO_DIK[e.code] || 0;
      mod._wasm_on_key_event(vk, dik, 0);
    };

    const canvas = canvasRef.current;
    const onMouseMove = (e: MouseEvent) => {
      if (helpOpenRef.current) return;
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_mouse_move !== 'function') return;
      const { x, y } = getCanvasCoords(e);
      mod._wasm_on_mouse_move(x, y);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (helpOpenRef.current) return;
      canvas?.focus();
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_mouse_button !== 'function') return;
      const { x, y } = getCanvasCoords(e);
      mod._wasm_on_mouse_button(e.button, 1, x, y);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (helpOpenRef.current) return;
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_mouse_button !== 'function') return;
      const { x, y } = getCanvasCoords(e);
      mod._wasm_on_mouse_button(e.button, 0, x, y);
    };

    const onDblClick = (e: MouseEvent) => {
      if (helpOpenRef.current) return;
      const mod = window.Module;
      if (!mod || typeof mod._wasm_on_mouse_button !== 'function') return;
      const { x, y } = getCanvasCoords(e);
      mod._wasm_on_mouse_button(e.button, 2, x, y);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    canvas?.addEventListener('mousemove', onMouseMove);
    canvas?.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas?.addEventListener('dblclick', onDblClick);
    canvas?.addEventListener('contextmenu', onContextMenu);

    return () => {
      mounted = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas?.removeEventListener('mousemove', onMouseMove);
      canvas?.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas?.removeEventListener('dblclick', onDblClick);
      canvas?.removeEventListener('contextmenu', onContextMenu);
    };
  }, [mode]);

  return (
    <>
      {mode === 'portal' ? (
        <PortalAuthPage
          lang={lang}
          onChangeLang={handleChangeLang}
          onOpenHelp={() => setHelpOpen(true)}
          onEnterGame={handleLaunchGameTab}
        />
      ) : (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          <div
            id="dr-wasm-wrapper"
            style={{
              position: 'relative',
              height: '100vh',
              width: 'calc(100vh * 4 / 3)',
              maxWidth: '100vw',
              maxHeight: 'calc(100vw * 3 / 4)',
              aspectRatio: '4 / 3'
            }}
          >
            <canvas
              id="dr-wasm-canvas"
              ref={canvasRef}
              width={800}
              height={600}
              tabIndex={0}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                outline: 'none',
                cursor: 'none'
              }}
            />
            {fps !== null && !status && (
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  padding: '2px 6px',
                  backgroundColor: 'rgba(14, 3, 0, 0.75)',
                  border: '1px solid #3e2a0c',
                  color: '#e7c95e',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  lineHeight: 1.2,
                  pointerEvents: 'none'
                }}
              >
                {fps} FPS
              </div>
            )}
            {status && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: '#0e0300',
                  border: '1px solid #3e2a0c',
                  color: '#e7c95e',
                  fontFamily: '"Cinzel", Georgia, serif',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: 22, letterSpacing: '0.08em' }}>
                  DRAGON RAJA ONLINE
                </div>
                <div
                  style={{
                    fontFamily: 'Tahoma, Verdana, sans-serif',
                    fontSize: 13,
                    color: '#96814a'
                  }}
                >
                  {status}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <HelpGuideModal
        open={helpOpen}
        lang={lang}
        onChangeLang={handleChangeLang}
        onClose={() => {
          setHelpOpen(false);
          if (mode === 'game') {
            canvasRef.current?.focus();
          }
        }}
      />
    </>
  );
}

export default App;
