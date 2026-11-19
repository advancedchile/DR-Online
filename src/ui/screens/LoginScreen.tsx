import React, { useEffect, useState } from 'react';
import { soundManager } from '../../engine/SoundManager';

interface LoginScreenProps {
  onLoginSuccess: (accountId: string, serverName: string) => void;
  onQuickPlayDefault: () => void;
}

const SERVERS = [
  { id: 'hadesz_global', name: 'Dragon Raja Global' },
  { id: 'local_server', name: 'Local Server (127.0.0.1)' }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess
}) => {
  const [accountId, setAccountId] = useState('DragonLord');
  const [password, setPassword] = useState('123456');
  const [step, setStep] = useState<'login' | 'server' | 'connecting'>('login');
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [hoverBtn, setHoverBtn] = useState<'login' | 'exit' | 'quit_srv' | null>(null);

  useEffect(() => {
    soundManager.playLoginTheme();
  }, []);

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playClick();
    setStep('server');
  };

  const handleSelectServer = (idx: number) => {
    soundManager.playClick();
    setSelectedServerIdx(idx);
    setStep('connecting');
    const srv = SERVERS[idx] || SERVERS[0];
    window.setTimeout(() => {
      onLoginSuccess(accountId.trim() || 'DragonLord', srv.name);
    }, 350);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 900,
        userSelect: 'none'
      }}
    >
      {/* Pure 800x600 Original Client Viewport */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 600,
          backgroundImage: `url('${
            step === 'connecting'
              ? '/api/data0/sprite?path=images/ui/legacy/start_etc.dat&frame=20'
              : '/api/data0/sprite?path=images/ui/legacy/newstartloginmenu.dat&frame=0'
          }')`,
          backgroundSize: '800px 600px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          overflow: 'hidden'
        }}
      >
        {(step === 'login' || step === 'server') && (
          <form onSubmit={handleLoginSubmit}>
            {/* Original USERNAME box in NewStartLoginMenu.dat[0]: (363, 358, 195x20) */}
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              autoFocus
              maxLength={18}
              style={{
                position: 'absolute',
                left: 365,
                top: 358,
                width: 191,
                height: 20,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontFamily: 'Tahoma, sans-serif',
                letterSpacing: 0.3,
                padding: '0 4px',
                textShadow: '1px 1px 0 #000'
              }}
            />

            {/* Original PASSWORD box in NewStartLoginMenu.dat[0]: (363, 398, 195x20) */}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={18}
              style={{
                position: 'absolute',
                left: 365,
                top: 398,
                width: 191,
                height: 20,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontFamily: 'Tahoma, sans-serif',
                letterSpacing: 1,
                padding: '0 4px',
                textShadow: '1px 1px 0 #000'
              }}
            />

            {/* Original LOGIN button hotspot: (363, 430, 93x20) */}
            <button
              type="submit"
              onMouseEnter={() => setHoverBtn('login')}
              onMouseLeave={() => setHoverBtn(null)}
              style={{
                position: 'absolute',
                left: 363,
                top: 430,
                width: 93,
                height: 20,
                backgroundColor: hoverBtn === 'login' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                border: hoverBtn === 'login' ? '1px solid rgba(180, 210, 255, 0.5)' : 'none',
                cursor: 'pointer',
                padding: 0
              }}
              title="Login"
            />

            {/* Original EXIT button hotspot: (466, 430, 93x20) */}
            <button
              type="button"
              onMouseEnter={() => setHoverBtn('exit')}
              onMouseLeave={() => setHoverBtn(null)}
              onClick={() => {
                soundManager.playClick();
                setAccountId('');
                setPassword('');
              }}
              style={{
                position: 'absolute',
                left: 466,
                top: 430,
                width: 93,
                height: 20,
                backgroundColor: hoverBtn === 'exit' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                border: hoverBtn === 'exit' ? '1px solid rgba(180, 210, 255, 0.5)' : 'none',
                cursor: 'pointer',
                padding: 0
              }}
              title="Exit"
            />
          </form>
        )}

        {/* Original select_server.dat[0] (223x224) modal popup */}
        {step === 'server' && (
          <div
            style={{
              position: 'absolute',
              left: 288,
              top: 188,
              width: 223,
              height: 224,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/select_server.dat&frame=0')`,
              backgroundSize: '223px 224px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated'
            }}
          >
            {/* Server entries inside the black area (14, 34, 195x156) */}
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 38,
                width: 191,
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {SERVERS.map((srv, idx) => {
                const isSel = selectedServerIdx === idx;
                return (
                  <div
                    key={srv.id}
                    onClick={() => handleSelectServer(idx)}
                    onMouseEnter={() => setSelectedServerIdx(idx)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 12,
                      fontFamily: 'Tahoma, sans-serif',
                      color: isSel ? '#ffff66' : '#d8d0c0',
                      backgroundColor: isSel ? 'rgba(90, 70, 35, 0.45)' : 'transparent',
                      textShadow: '1px 1px 0 #000',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {srv.name}
                  </div>
                );
              })}
            </div>

            {/* Original Quit button at bottom of select_server.dat[0]: (74, 198, 75x20) */}
            <div
              onMouseEnter={() => setHoverBtn('quit_srv')}
              onMouseLeave={() => setHoverBtn(null)}
              onClick={() => {
                soundManager.playClick();
                setStep('login');
              }}
              style={{
                position: 'absolute',
                left: 74,
                top: 198,
                width: 75,
                height: 20,
                backgroundImage:
                  hoverBtn === 'quit_srv'
                    ? `url('/api/data0/sprite?path=images/ui/legacy/select_server.dat&frame=6')`
                    : 'none',
                backgroundSize: '75px 20px',
                cursor: 'pointer'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
