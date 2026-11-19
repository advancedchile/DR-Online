import React, { useState } from 'react';
import { EXTRACTED_DATA } from '../../data/worldCatalog';
import { GameItem } from '../../types/game';

interface LegendWorkshopWindowProps {
  gold: number;
  equipped: Partial<Record<string, GameItem>>;
  onUpgradeLegendItem: (slotKey: string) => void;
  onEnchantMantleOrSaddle: (slotKey: 'mantle' | 'saddle') => void;
  onEquipSymbol: (sym: { id: number; name: string; grade: number; statBonus: string }) => void;
  onClose: () => void;
}

export const LegendWorkshopWindow: React.FC<LegendWorkshopWindowProps> = ({
  equipped,
  onUpgradeLegendItem,
  onEnchantMantleOrSaddle,
  onEquipSymbol,
  onClose
}) => {
  const equippedEntries = Object.entries(equipped).filter(([, it]) => Boolean(it)) as [
    string,
    GameItem
  ][];
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedEntry = equippedEntries[selectedIdx] ?? equippedEntries[0];

  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 110,
        width: 320,
        height: 232,
        backgroundImage: `url('/assets/original/ui/windows/legend_dual_bg.png')`,
        backgroundSize: '320px 232px',
        backgroundRepeat: 'no-repeat',
        zIndex: 85,
        pointerEvents: 'auto',
        userSelect: 'none',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#f1e5c8'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* Top right close hotspot on frame corner */}
      <button
        type="button"
        title="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          right: 6,
          top: 6,
          width: 24,
          height: 24,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      />

      {/* Recessed inner box (22, 50, 276x110) */}
      <div
        style={{
          position: 'absolute',
          left: 22,
          top: 50,
          width: 276,
          height: 110,
          background: 'rgba(18, 14, 10, 0.88)',
          padding: '6px 8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {equippedEntries.map(([slotKey, item], idx) => (
          <div
            key={slotKey}
            onClick={() => setSelectedIdx(idx)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '2px 4px',
              cursor: 'pointer',
              background: idx === selectedIdx ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
              color: idx === selectedIdx ? '#fde047' : '#e5d5b5'
            }}
          >
            <span>
              [{slotKey.toUpperCase()}] {item.name}
            </span>
            <span>G{item.grade}/G5</span>
          </div>
        ))}
        <div
          onClick={() => onEnchantMantleOrSaddle('mantle')}
          style={{ padding: '2px 4px', cursor: 'pointer', color: '#93c5fd' }}
        >
          &gt; Enchant Mantle (2,500 Cell)
        </div>
        <div
          onClick={() => onEnchantMantleOrSaddle('saddle')}
          style={{ padding: '2px 4px', cursor: 'pointer', color: '#93c5fd' }}
        >
          &gt; Enchant Horse Saddle (2,500 Cell)
        </div>
        {EXTRACTED_DATA.symbols.slice(0, 4).map((sym) => (
          <div
            key={sym.id}
            onClick={() => onEquipSymbol(sym)}
            style={{ padding: '2px 4px', cursor: 'pointer', color: '#86efac' }}
          >
            &gt; Symbol: {sym.name} (G{sym.grade})
          </div>
        ))}
      </div>

      {/* Baked bottom stone button (20, 173, 280x42) */}
      <button
        type="button"
        title="Upgrade Selected Gear"
        onClick={() => {
          if (selectedEntry) {
            onUpgradeLegendItem(selectedEntry[0]);
          } else {
            onClose();
          }
        }}
        style={{
          position: 'absolute',
          left: 20,
          top: 173,
          width: 280,
          height: 42,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
