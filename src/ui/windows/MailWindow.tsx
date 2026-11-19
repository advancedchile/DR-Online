import React, { useState } from 'react';
import { MailEntry } from '../../types/game';

interface MailWindowProps {
  mails: MailEntry[];
  onClaimMail: (mailId: string) => void;
  onClose: () => void;
}

export const MailWindow: React.FC<MailWindowProps> = ({ mails, onClaimMail, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(mails[0]?.id ?? null);
  const selectedMail = mails.find((m) => m.id === selectedId) ?? null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 200,
        top: 15,
        width: 399,
        height: 490,
        backgroundImage: `url('/assets/original/ui/windows/mail_bg.png')`,
        backgroundSize: '399px 490px',
        backgroundRepeat: 'no-repeat',
        zIndex: 85,
        pointerEvents: 'auto',
        userSelect: 'none',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#f1e5c8'
      }}
    >
      {/* 10 Engraved Mail Rows (y=115, step=28px) */}
      {mails.slice(0, 10).map((m, idx) => {
        const rowY = 115 + idx * 28;
        const isSel = m.id === selectedId;
        return (
          <div
            key={m.id}
            onClick={() => {
              setSelectedId(m.id);
              if (m.attachedGold && !m.claimed) {
                onClaimMail(m.id);
              }
            }}
            title={`${m.subject}\n${m.body}`}
            style={{
              position: 'absolute',
              left: 25,
              top: rowY,
              width: 352,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: isSel ? 'rgba(212, 175, 55, 0.18)' : 'transparent'
            }}
          >
            {/* Checkbox (w=20) */}
            <div style={{ width: 22, textAlign: 'center', color: '#fde047' }}>
              {isSel ? '✓' : ''}
            </div>
            {/* Type (w=24) */}
            <div style={{ width: 25, textAlign: 'center', fontSize: 10, color: '#93c5fd' }}>
              {m.claimed ? 'R' : 'N'}
            </div>
            {/* Sender (w=105) */}
            <div
              style={{
                width: 106,
                paddingLeft: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {m.sender}
            </div>
            {/* Subject (w=138) */}
            <div
              style={{
                width: 138,
                paddingLeft: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: m.attachedGold && !m.claimed ? '#fde047' : '#f1e5c8'
              }}
            >
              {m.subject}
            </div>
            {/* Date (w=55) */}
            <div style={{ width: 55, textAlign: 'center', fontSize: 10, color: '#d6c7a9' }}>
              {m.date}
            </div>
          </div>
        );
      })}

      {/* Floating original tooltip showing selected mail body */}
      {selectedMail && (
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 365,
            width: 348,
            height: 34,
            fontSize: 10,
            color: '#fde047',
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          {selectedMail.body}{' '}
          {selectedMail.attachedGold
            ? selectedMail.claimed
              ? '(Gold Claimed)'
              : `[Click row to claim ${selectedMail.attachedGold} Cell]`
            : ''}
        </div>
      )}

      {/* Baked Exit Button (305, 442, 76x28) */}
      <button
        type="button"
        title="Exit"
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 305,
          top: 442,
          width: 76,
          height: 28,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
