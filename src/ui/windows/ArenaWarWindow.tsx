import React from 'react';
import { ArenaLeaderboardEntry, NationWarState } from '../../types/game';

interface ArenaWarWindowProps {
  nationWar: NationWarState;
  leaderboard: ArenaLeaderboardEntry[];
  onWarpToMap: (mapId: string) => void;
  onSpawnArenaBoss: () => void;
  onClose: () => void;
}

export const ArenaWarWindow: React.FC<ArenaWarWindowProps> = ({
  nationWar,
  leaderboard,
  onWarpToMap,
  onSpawnArenaBoss,
  onClose
}) => {
  const mins = Math.floor(nationWar.timeRemainingSec / 60);
  const secs = nationWar.timeRemainingSec % 60;

  return (
    <div
      style={{
        position: 'absolute',
        left: 151,
        top: 64,
        width: 498,
        height: 352,
        backgroundImage: `url('/assets/original/ui/windows/warstatus_bg.png')`,
        backgroundSize: '498px 352px',
        backgroundRepeat: 'no-repeat',
        zIndex: 85,
        pointerEvents: 'auto',
        userSelect: 'none',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#f1e5c8'
      }}
    >
      {/* Left Recessed Box (18, 46, 288x288) */}
      <div
        style={{
          position: 'absolute',
          left: 18,
          top: 46,
          width: 288,
          height: 288,
          padding: 8,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        {nationWar.guardStones.map((gs) => (
          <div
            key={gs.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 4px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <img
              src="/assets/original/ui/mw/stone.png"
              alt={gs.name}
              draggable={false}
              style={{ width: 22, height: 22 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fde047', fontWeight: 700 }}>
                [{gs.nation}] {gs.name}
              </div>
              <div style={{ fontSize: 10, color: '#d6c7a9' }}>
                HP: {gs.hp.toLocaleString()} / {gs.maxHp.toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        <div
          onClick={() => onWarpToMap('HUDSON')}
          style={{
            marginTop: 4,
            color: '#93c5fd',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          &gt; Enter Nation War Battlefield
        </div>
        <div
          onClick={onSpawnArenaBoss}
          style={{
            color: '#fca5a5',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          &gt; Challenge Colosseum Boss
        </div>

        <div style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 4 }}>
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                padding: '2px 0',
                color: '#d6c7a9'
              }}
            >
              <span>
                #{entry.rank} {entry.name} ({entry.nation})
              </span>
              <span>
                Lv.{entry.level} {entry.className} ({entry.wins}W)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Left Value Box (405, 68, 66x22) */}
      <div
        style={{
          position: 'absolute',
          left: 405,
          top: 68,
          width: 66,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fde047',
          fontWeight: 700
        }}
      >
        {mins}:{secs.toString().padStart(2, '0')}
      </div>

      {/* Vyseus Score Box (405, 158, 66x22) */}
      <div
        style={{
          position: 'absolute',
          left: 405,
          top: 158,
          width: 66,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#93c5fd',
          fontWeight: 700
        }}
      >
        {nationWar.scores.Vyseus}
      </div>

      {/* Zypern Score Box (405, 250, 66x22) */}
      <div
        style={{
          position: 'absolute',
          left: 405,
          top: 250,
          width: 66,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fca5a5',
          fontWeight: 700
        }}
      >
        {nationWar.scores.Zypern}
      </div>

      {/* Baked DONE Button (356, 303, 76x26) */}
      <button
        type="button"
        title="DONE"
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 356,
          top: 303,
          width: 76,
          height: 26,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
