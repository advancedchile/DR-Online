import React, { useState } from 'react';
import { ClassId, NationId } from '../../types/game';

interface PartyGuildWindowProps {
  playerName: string;
  playerNation: NationId;
  playerClass: ClassId;
  dualClass: string;
  level: number;
  fame: number;
  onChangeNation: (n: NationId) => void;
  onClose: () => void;
}

const PARTY_ROSTER = [
  { name: 'SansonPercival', cls: 'WARRIOR', lv: 65, faceIdx: 0, gender: 'male' },
  { name: 'Tybern', cls: 'WIZARD', lv: 62, faceIdx: 1, gender: 'male' },
  { name: 'IrurilSereniel', cls: 'ARCHER', lv: 70, faceIdx: 1, gender: 'female' },
  { name: 'OremHighPriest', cls: 'PRIEST', lv: 58, faceIdx: 2, gender: 'male' },
  { name: 'KarlHuch', cls: 'THIEF', lv: 64, faceIdx: 3, gender: 'male' },
  { name: 'Neria', cls: 'THIEF', lv: 60, faceIdx: 2, gender: 'female' }
];

export const PartyGuildWindow: React.FC<PartyGuildWindowProps> = ({
  onClose
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const selectedMember = PARTY_ROSTER[selectedIdx] || PARTY_ROSTER[0];

  return (
    /* Pure 1:1 319x352 Original RELATION / PARTY / EMPLOYMENT Window (SysMenu.dat[849]) */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 160px)',
        top: 'max(15px, calc(50vh - 220px))',
        width: 319,
        height: 352,
        backgroundImage: `url('/assets/original/ui/windows/party_orig_bg.png')`,
        backgroundSize: '319px 352px',
        backgroundRepeat: 'no-repeat',
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Selected Member Portrait Box: (32, 76, 64x72) */}
      <div
        style={{
          position: 'absolute',
          left: 34,
          top: 78,
          width: 60,
          height: 68,
          overflow: 'hidden'
        }}
      >
        <img
          src={`/api/data0/sprite?path=images/ui/legacy/${
            selectedMember.gender === 'female' ? 'face_woman_m.dat' : 'face_man_m.dat'
          }&frame=${selectedMember.faceIdx}`}
          alt={selectedMember.name}
          draggable={false}
          style={{ width: 60, height: 68, imageRendering: 'pixelated' }}
        />
      </div>

      {/* Selected Member Name Box: (146, 86, 120x18) */}
      <div
        className="dr-orig-cs-val"
        style={{
          left: 146,
          top: 86,
          width: 120,
          textAlign: 'center',
          color: '#ffff88'
        }}
      >
        {selectedMember.name}
      </div>

      {/* Selected Member Class Box: (182, 122, 84x18) */}
      <div
        className="dr-orig-cs-val"
        style={{
          left: 182,
          top: 122,
          width: 84,
          textAlign: 'center'
        }}
      >
        {selectedMember.cls}
      </div>

      {/* 6 Party Slots Grid (I..VI at 3 cols x 2 rows: left=22 + col*70, top=164 + row*60) */}
      {PARTY_ROSTER.map((m, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const sx = 24 + col * 68;
        const sy = 166 + row * 62;
        const isSel = selectedIdx === idx;
        return (
          <div
            key={m.name}
            onClick={() => setSelectedIdx(idx)}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              width: 60,
              height: 54,
              border: isSel ? '1px solid #ffff66' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 2
            }}
          >
            <span
              style={{
                fontFamily: 'Tahoma, sans-serif',
                fontSize: 10,
                color: isSel ? '#ffff88' : '#e5d0a1',
                textShadow: '1px 1px 0 #000',
                maxWidth: 56,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {m.name}
            </span>
          </div>
        );
      })}

      {/* Original DONE Button Hotspot (242, 260, 62x22) & Bottom Close Hotspot */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 240,
          top: 256,
          width: 64,
          height: 26,
          cursor: 'pointer'
        }}
      />
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 235,
          top: 315,
          width: 74,
          height: 28,
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
