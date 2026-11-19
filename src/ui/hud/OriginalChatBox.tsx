import React, { useState } from 'react';
import { ChatMessage } from '../../types/game';

interface OriginalChatBoxProps {
  messages: ChatMessage[];
}

const CHANNEL_CHECKBOXES: Array<{
  key: 'Normal' | 'Whisper' | 'Guild' | 'Party' | 'Nation';
  y: number;
  normalFrame: number;
  checkedFrame: number;
}> = [
  { key: 'Normal', y: 29, normalFrame: 3, checkedFrame: 4 },
  { key: 'Whisper', y: 54, normalFrame: 5, checkedFrame: 6 },
  { key: 'Guild', y: 79, normalFrame: 7, checkedFrame: 8 },
  { key: 'Party', y: 104, normalFrame: 13, checkedFrame: 12 },
  { key: 'Nation', y: 129, normalFrame: 3, checkedFrame: 4 }
];

const CHANNEL_COLORS: Record<ChatMessage['channel'], string> = {
  Normal: '#ffffff',
  Whisper: '#7dd3fc',
  Guild: '#fde047',
  Party: '#86efac',
  Nation: '#f9a8d4',
  System: '#fbbf24'
};

export const OriginalChatBox: React.FC<OriginalChatBoxProps> = ({ messages }) => {
  const [enabledChannels, setEnabledChannels] = useState<Record<string, boolean>>({
    Normal: true,
    Whisper: true,
    Guild: true,
    Party: true,
    Nation: true
  });
  const [isMoving, setIsMoving] = useState(false);

  const toggleChannel = (ch: string) => {
    setEnabledChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const visibleMessages = messages
    .filter((m) => m.channel === 'System' || enabledChannels[m.channel] !== false)
    .slice(-8);

  return (
    /* Exact ChatBox.xml: width="454" height="155" anchored at BOTTOMLEFT y="-107" */
    <div
      style={{
        position: 'fixed',
        left: 'max(0px, calc(50vw - 400px))',
        bottom: 107,
        width: 454,
        height: 155,
        zIndex: 25,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {/* Left vertical bar: images/ui/legacy/NewChatBack.dat index="0" (22x144) at (0, 5) */}
      <img
        src="/api/data0/sprite?path=images/ui/legacy/newchatback.dat&frame=0"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: 0,
          top: 5,
          width: 22,
          height: 144,
          imageRendering: 'pixelated',
          pointerEvents: 'auto'
        }}
      />

      {/* ChatBoxMove checkbox at (3, 10) */}
      <img
        src={`/api/data0/sprite?path=images/ui/legacy/newchatback.dat&frame=${isMoving ? 2 : 1}`}
        alt=""
        draggable={false}
        onClick={() => setIsMoving((m) => !m)}
        style={{
          position: 'absolute',
          left: 3,
          top: 10,
          width: 16,
          height: 16,
          imageRendering: 'pixelated',
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
      />

      {/* 5 Channel Checkboxes: Normal (3,29), Whisper (3,54), Guild (3,79), Party (3,104), Nation (3,129) */}
      {CHANNEL_CHECKBOXES.map((cb) => {
        const checked = enabledChannels[cb.key] !== false;
        return (
          <img
            key={cb.key}
            src={`/api/data0/sprite?path=images/ui/legacy/newchatback.dat&frame=${
              checked ? cb.checkedFrame : cb.normalFrame
            }`}
            alt={cb.key}
            draggable={false}
            onClick={() => toggleChannel(cb.key)}
            style={{
              position: 'absolute',
              left: 3,
              top: cb.y,
              width: 16,
              height: 16,
              imageRendering: 'pixelated',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          />
        );
      })}

      {/* Chat messages container (TOPLEFT x="26" y="6", BOTTOMRIGHT x="-2" y="-5") */}
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: 6,
          right: 2,
          bottom: 5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 1,
          overflow: 'hidden'
        }}
      >
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            style={{
              fontFamily: 'Tahoma, sans-serif',
              fontSize: 12,
              lineHeight: '16px',
              color: CHANNEL_COLORS[m.channel] || '#ffffff',
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              padding: '0 4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {m.sender}: {m.text}
          </div>
        ))}
      </div>
    </div>
  );
};
