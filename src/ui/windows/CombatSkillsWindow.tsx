import React, { useState } from 'react';
import { CombatSkillEntry } from '../../types/game';

interface CombatSkillsWindowProps {
  cp: number;
  maxCp: number;
  dualClass: string;
  dualGrade: number;
  combatSkills: CombatSkillEntry[];
  quickCombatSkillId: string;
  onSelectQuickCombatSkill: (csId: string) => void;
  onUseCombatSkill: (cs: CombatSkillEntry) => void;
  onLearnCombatSkill: (csId: string) => void;
  onClose: () => void;
}

// Exact measured socket coordinates on CombatSkillPoint.dat[0, 9, 10] (324x420)
const TREE_SOCKETS = [
  { left: 141, top: 135 },
  { left: 46, top: 154 },
  { left: 242, top: 154 },
  { left: 68, top: 234 },
  { left: 215, top: 234 },
  { left: 142, top: 305 }
];

export const CombatSkillsWindow: React.FC<CombatSkillsWindowProps> = ({
  cp,
  combatSkills,
  quickCombatSkillId,
  onSelectQuickCombatSkill,
  onUseCombatSkill,
  onLearnCombatSkill,
  onClose
}) => {
  const [treePage, setTreePage] = useState<number>(0);
  const [hoveredSkill, setHoveredSkill] = useState<{
    cs: CombatSkillEntry;
    x: number;
    y: number;
  } | null>(null);
  const [hoverDone, setHoverDone] = useState(false);

  const pageSkills = combatSkills.slice(treePage * 6, treePage * 6 + 6);
  const bgFrame = treePage === 0 ? 0 : treePage === 1 ? 9 : 10;

  return (
    /* Pure 1:1 324x420 CombatSkillPoint.dat[0, 9, 10] Stone Tree Tablet */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 162px)',
        top: 'max(10px, calc(50vh - 245px))',
        width: 324,
        height: 420,
        backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/combatskillpoint.dat&frame=${bgFrame}')`,
        backgroundSize: '324px 420px',
        backgroundRepeat: 'no-repeat',
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 3 Top Mastery Group Tabs (top: 66, left: 38 / 124 / 210, 72x30) */}
      {[
        { idx: 0, left: 38 },
        { idx: 1, left: 126 },
        { idx: 2, left: 214 }
      ].map((tab) => (
        <button
          key={tab.idx}
          type="button"
          className="dr-orig-abs-btn"
          style={{
            left: tab.left,
            top: 66,
            width: 72,
            height: 30
          }}
          onClick={() => setTreePage(tab.idx)}
        />
      ))}

      {/* 6 Skill Tree Sockets on Stone Tablet */}
      {TREE_SOCKETS.map((pos, idx) => {
        const cs = pageSkills[idx];
        if (!cs) return null;
        const isQuick = cs.id === quickCombatSkillId;
        return (
          <button
            key={cs.id}
            type="button"
            className={`dr-orig-abs-slot ${isQuick ? 'selected' : ''}`}
            style={{
              left: pos.left,
              top: pos.top,
              width: 42,
              height: 42,
              opacity: cs.learned ? 1 : 0.45
            }}
            onMouseEnter={() => setHoveredSkill({ cs, x: pos.left, y: pos.top })}
            onMouseLeave={() => setHoveredSkill(null)}
            onClick={() => {
              if (cs.learned) {
                onSelectQuickCombatSkill(cs.id);
              } else {
                onLearnCombatSkill(cs.id);
              }
            }}
            onDoubleClick={() => {
              if (cs.learned) {
                onUseCombatSkill(cs);
              } else {
                onLearnCombatSkill(cs.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (cs.learned) {
                onUseCombatSkill(cs);
              } else {
                onLearnCombatSkill(cs.id);
              }
            }}
          >
            <img
              src={cs.iconUrl || '/assets/original/icons/cskills/cs_0.png'}
              alt={cs.name}
              style={{ width: 34, height: 34, objectFit: 'contain' }}
              draggable={false}
            />
          </button>
        );
      })}

      {/* Point Readout (268, 332) */}
      <div
        className="dr-orig-cs-val"
        style={{
          left: 268,
          top: 332,
          width: 36,
          textAlign: 'center',
          color: '#fde047',
          fontWeight: 700
        }}
      >
        {cp}
      </div>

      {/* Native "Done" Button Hotspot (121, 372, 82x35) -> CombatSkillPoint.dat frame=42/43 */}
      <div
        onMouseEnter={() => setHoverDone(true)}
        onMouseLeave={() => setHoverDone(false)}
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 121,
          top: 372,
          width: 82,
          height: 35,
          backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/combatskillpoint.dat&frame=${
            hoverDone ? 43 : 42
          }')`,
          backgroundSize: '82px 35px',
          backgroundRepeat: 'no-repeat',
          cursor: 'pointer'
        }}
      />

      {/* Authentic Dragon Raja TxtBgBlack Floating Tooltip on Hover */}
      {hoveredSkill && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(130, Math.max(8, hoveredSkill.x - 40)),
            top: Math.max(8, hoveredSkill.y - 68),
            width: 185,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            border: '1px solid #8a7344',
            padding: '5px 8px',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            color: '#ffffff',
            textShadow: '1px 1px 0 #000',
            pointerEvents: 'none',
            zIndex: 80
          }}
        >
          <div style={{ color: '#ffff66', fontWeight: 700 }}>{hoveredSkill.cs.name}</div>
          <div>
            Req Lv.{hoveredSkill.cs.reqLevel} • {hoveredSkill.cs.cpCost} CP
          </div>
          <div style={{ color: '#93c5fd', fontSize: 10 }}>
            Damage: x{hoveredSkill.cs.damageMultiplier}
          </div>
          <div style={{ color: '#a3e635', fontSize: 10 }}>
            {hoveredSkill.cs.learned
              ? 'Left-click: Quick CP | Right-click: Use'
              : 'Click to Learn'}
          </div>
        </div>
      )}
    </div>
  );
};
