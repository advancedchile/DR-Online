import React, { useState } from 'react';
import { SpellEntry } from '../../types/game';

interface SpellbookWindowProps {
  spells: SpellEntry[];
  quickSpellId: string;
  onSelectQuickSpell: (spellId: string) => void;
  onCastSpell: (spell: SpellEntry) => void;
  onLearnSpell: (spellId: string) => void;
  onClose: () => void;
}

// Original Roman Numeral Bookmark Sprites in sysmenu.dat: I..VI = 1..6, VII..X = 80..83 (31x32)
const ROMAN_TAB_FRAMES = [1, 2, 3, 4, 5, 6, 80, 81];

export const SpellbookWindow: React.FC<SpellbookWindowProps> = ({
  spells,
  quickSpellId,
  onSelectQuickSpell,
  onCastSpell,
  onLearnSpell,
  onClose
}) => {
  const [school, setSchool] = useState<'wizard' | 'priest'>('wizard');
  const [pageIdx, setPageIdx] = useState<number>(0);
  const [hoveredSpell, setHoveredSpell] = useState<{
    sp: SpellEntry;
    x: number;
    y: number;
  } | null>(null);

  const filtered = spells.filter((s) => s.type === school);
  const perSpread = 8; // 4 on left parchment page, 4 on right parchment page
  const totalSpreads = Math.max(1, Math.min(8, Math.ceil(filtered.length / perSpread)));
  const clampedPage = Math.min(pageIdx, totalSpreads - 1);
  const leftPageSpells = filtered.slice(clampedPage * perSpread, clampedPage * perSpread + 4);
  const rightPageSpells = filtered.slice(clampedPage * perSpread + 4, clampedPage * perSpread + 8);

  const renderSpellSlot = (sp: SpellEntry, idxOnPage: number, isRightPage: boolean) => {
    const isQuick = sp.id === quickSpellId;
    const baseLeft = isRightPage ? 278 : 48;
    const baseTop = 48 + idxOnPage * 56;
    return (
      <div
        key={sp.id}
        onMouseEnter={() => setHoveredSpell({ sp, x: baseLeft, y: baseTop })}
        onMouseLeave={() => setHoveredSpell(null)}
        onClick={() => {
          if (sp.learned) {
            onSelectQuickSpell(sp.id);
          } else {
            onLearnSpell(sp.id);
          }
        }}
        onDoubleClick={() => {
          if (sp.learned) {
            onCastSpell(sp);
          } else {
            onLearnSpell(sp.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (sp.learned) {
            onCastSpell(sp);
          } else {
            onLearnSpell(sp.id);
          }
        }}
        style={{
          position: 'absolute',
          left: baseLeft,
          top: baseTop,
          width: 196,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          opacity: sp.learned ? 1 : 0.48
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            border: isQuick ? '1px solid #ffff66' : '1px solid rgba(90, 65, 30, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <img
            src={sp.iconUrl || '/assets/original/icons/magic/w001.png'}
            alt={sp.name}
            style={{ width: 34, height: 34, imageRendering: 'pixelated' }}
            draggable={false}
          />
        </div>
        <div
          style={{
            fontFamily: 'Tahoma, sans-serif',
            color: '#2b1d0e',
            lineHeight: '14px'
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: isQuick ? '#7c2d12' : '#231709' }}>
            {sp.name}
          </div>
          <div style={{ fontSize: 10, color: '#4a3520' }}>
            Lv.{sp.reqLevel} • {sp.type === 'wizard' ? `${sp.mpCost} MP` : `${sp.dpCost} DP`}
          </div>
        </div>
      </div>
    );
  };

  return (
    /* Pure 1:1 547x338 Open Grimoire Book from SysMenu.dat[965] */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 273px)',
        top: 'max(15px, calc(50vh - 210px))',
        width: 547,
        height: 338,
        backgroundImage: `url('/assets/original/ui/windows/wizard_grimoire_bg.png')`,
        backgroundSize: '547px 338px',
        backgroundRepeat: 'no-repeat',
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Original WIZARD SPELL / PRIEST SPELL header banner toggle (sysmenu.dat #131) */}
      <div
        onClick={() => {
          setSchool((s) => (s === 'wizard' ? 'priest' : 'wizard'));
          setPageIdx(0);
        }}
        style={{
          position: 'absolute',
          left: 110,
          top: 12,
          width: 298,
          height: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#3b2712'
        }}
      >
        {school === 'wizard' ? 'WIZARD SPELL' : 'PRIEST ORISON'}
      </div>

      {/* Left & Right Grimoire Parchment Pages */}
      {leftPageSpells.map((sp, i) => renderSpellSlot(sp, i, false))}
      {rightPageSpells.map((sp, i) => renderSpellSlot(sp, i, true))}

      {/* Right-side Original Roman Numeral Bookmark Tabs (sysmenu.dat #1..6, #80..81) */}
      {Array.from({ length: totalSpreads }).map((_, idx) => (
        <img
          key={idx}
          src={`/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=${
            ROMAN_TAB_FRAMES[idx] || 1
          }`}
          alt={`Page ${idx + 1}`}
          draggable={false}
          onClick={() => setPageIdx(idx)}
          style={{
            position: 'absolute',
            left: 502,
            top: 26 + idx * 34,
            width: 31,
            height: 32,
            cursor: 'pointer',
            imageRendering: 'pixelated',
            filter: clampedPage === idx ? 'brightness(1.25)' : 'brightness(0.85)'
          }}
        />
      ))}

      {/* Bottom Original PREVIOUS (#67), NEXT (#66), and DONE (#123) Sprites */}
      <img
        src="/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=67"
        alt="Previous"
        draggable={false}
        onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
        style={{
          position: 'absolute',
          left: 62,
          top: 304,
          width: 91,
          height: 16,
          cursor: 'pointer',
          imageRendering: 'pixelated'
        }}
      />
      <img
        src="/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=66"
        alt="Next"
        draggable={false}
        onClick={() => setPageIdx((p) => Math.min(totalSpreads - 1, p + 1))}
        style={{
          position: 'absolute',
          left: 166,
          top: 304,
          width: 91,
          height: 16,
          cursor: 'pointer',
          imageRendering: 'pixelated'
        }}
      />
      <img
        src="/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=123"
        alt="Done"
        draggable={false}
        onClick={onClose}
        style={{
          position: 'absolute',
          left: 382,
          top: 304,
          width: 74,
          height: 15,
          cursor: 'pointer',
          imageRendering: 'pixelated'
        }}
      />

      {/* Authentic Dragon Raja TxtBgBlack Floating Tooltip on Hover */}
      {hoveredSpell && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(340, Math.max(12, hoveredSpell.x)),
            top: Math.max(12, hoveredSpell.y - 64),
            width: 190,
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
          <div style={{ color: '#ffff66', fontWeight: 700 }}>{hoveredSpell.sp.name}</div>
          <div>
            Circle {hoveredSpell.sp.circle} (Lv.{hoveredSpell.sp.reqLevel}) • Power{' '}
            {hoveredSpell.sp.power}
          </div>
          <div style={{ color: '#a3e635', fontSize: 10 }}>
            {hoveredSpell.sp.learned
              ? 'Click: QuickMagic [/] | Right-Click: Cast'
              : 'Click to Learn Spell'}
          </div>
        </div>
      )}
    </div>
  );
};
