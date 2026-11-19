import React, { useState } from 'react';
import { ActiveWindowId, GameItem } from '../../types/game';
import { soundManager } from '../../engine/SoundManager';

interface InventoryWindowProps {
  gold: number;
  equipped: Partial<Record<string, GameItem>>;
  inventory: GameItem[];
  potionBox: GameItem[];
  onEquipItem: (item: GameItem) => void;
  onUnequipSlot: (slotKey: string) => void;
  onUseItem: (item: GameItem, fromPotionBox?: boolean) => void;
  onSellItem: (item: GameItem) => void;
  onRepairAll: () => void;
  onOpenWindow: (win: ActiveWindowId) => void;
  onClose: () => void;
}

// Exact coordinates from kh_menuset.cpp:3461 (MN_ITEM, AddHorz=6, AddVert=4)
const EQUIP_SLOT_RECTS: Array<{
  key: string;
  altKey?: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
}> = [
  { key: 'weapon', label: 'Weapon (Right Hand)', left: 158, top: 68, width: 40, height: 40 },
  { key: 'shield', label: 'Shield (Left Hand)', left: 263, top: 156, width: 40, height: 40 },
  { key: 'helmet', altKey: 'helm', label: 'Helmet', left: 261, top: 70, width: 40, height: 40 },
  { key: 'armor', label: 'Body Armor', left: 214, top: 113, width: 40, height: 40 },
  { key: 'necklace', label: 'Necklace / Amulet', left: 26, top: 131, width: 32, height: 32 },
  { key: 'shoes', label: 'Shoes / Boots', left: 73, top: 131, width: 32, height: 32 },
  { key: 'ring1', label: 'Ring / Unique 1', left: 33, top: 71, width: 32, height: 32 },
  { key: 'mantle', altKey: 'ring2', label: 'Mantle / Unique 2', left: 69, top: 71, width: 32, height: 32 },
  { key: 'symbol', label: 'Symbol / Relic', left: 138, top: 134, width: 40, height: 40 }
];

const INV_SPRITE = (frame: number) =>
  `/api/data0/sprite?path=images/ui/legacy/localized/en/newinventory.dat&frame=${frame}`;

export const InventoryWindow: React.FC<InventoryWindowProps> = ({
  gold,
  equipped,
  inventory,
  onEquipItem,
  onUnequipSlot,
  onUseItem,
  onOpenWindow,
  onClose
}) => {
  const [bagPage, setBagPage] = useState<number>(0);
  const [hoveredItem, setHoveredItem] = useState<{ item: GameItem; x: number; y: number } | null>(null);
  const [hoverBtn, setHoverBtn] = useState<'spell' | 'up' | 'down' | 'done' | null>(null);
  const [pressBtn, setPressBtn] = useState<'spell' | 'up' | 'down' | 'done' | null>(null);

  const pageOffset = bagPage * 24;

  const handleBagItemAction = (it: GameItem) => {
    if (
      it.category === 'weapon' ||
      it.category === 'armor' ||
      it.category === 'accessory' ||
      it.category === 'tool'
    ) {
      soundManager.playEquip();
      onEquipItem(it);
    } else {
      onUseItem(it, false);
    }
  };

  return (
    /* Exact 1:1 MN_ITEM (327x359) from kh_menuset.cpp:3461 positioned at x=473, y=0 in 800x600 viewport */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        right: 'max(0px, calc(50vw - 400px))',
        top: 'max(0px, calc(50vh - 300px))',
        width: 327,
        height: 359,
        backgroundImage: `url('${INV_SPRITE(0)}')`,
        backgroundSize: '327px 359px',
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Field 7 (kh_menuset.cpp:3472): NewInventory.dat[1] (176x147) Paperdoll & Equipment Panel at (132, 46) */}
      <img
        src={INV_SPRITE(1)}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: 132,
          top: 46,
          width: 176,
          height: 147,
          pointerEvents: 'none'
        }}
      />

      {/* 9 Exact Equipment Slots on MN_ITEM */}
      {EQUIP_SLOT_RECTS.map((sl) => {
        const eqItem = equipped[sl.key] || (sl.altKey ? equipped[sl.altKey] : undefined);
        const actualKey = equipped[sl.key] ? sl.key : sl.altKey || sl.key;
        return (
          <button
            key={sl.key}
            type="button"
            className="dr-orig-abs-slot"
            style={{
              left: sl.left,
              top: sl.top,
              width: sl.width,
              height: sl.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={() => eqItem && setHoveredItem({ item: eqItem, x: sl.left, y: sl.top })}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => {
              if (eqItem) {
                soundManager.playItemPickup();
                onUnequipSlot(actualKey);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (eqItem) {
                soundManager.playItemPickup();
                onUnequipSlot(actualKey);
              }
            }}
          >
            {eqItem?.iconUrl && (
              <img
                src={eqItem.iconUrl}
                alt={eqItem.name}
                style={{
                  maxWidth: sl.width - 4,
                  maxHeight: sl.height - 4,
                  imageRendering: 'pixelated',
                  objectFit: 'contain'
                }}
                draggable={false}
              />
            )}
          </button>
        );
      })}

      {/* Field 16: DP_COIN Gold / Crit Readout at (23, 180, 93x15) */}
      <div
        className="dr-orig-cs-val"
        style={{
          left: 23,
          top: 181,
          width: 93,
          height: 15,
          lineHeight: '15px',
          textAlign: 'right',
          paddingRight: 4,
          fontSize: 11,
          color: '#fde047',
          fontWeight: 700,
          pointerEvents: 'none'
        }}
      >
        {gold.toLocaleString()}
      </div>

      {/* Field 17: 24 Backpack Slots (8 cols x 3 rows at 25 + col*35, 205 + row*35, 32x32) */}
      {Array.from({ length: 24 }).map((_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const it = inventory[pageOffset + i];
        const sx = 25 + col * 35;
        const sy = 205 + row * 35;
        return (
          <button
            key={it ? it.uid : `bag_${pageOffset + i}`}
            type="button"
            className="dr-orig-abs-slot"
            style={{
              left: sx,
              top: sy,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={() => it && setHoveredItem({ item: it, x: sx, y: sy })}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => it && handleBagItemAction(it)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (it) handleBagItemAction(it);
            }}
          >
            {it?.iconUrl && (
              <img
                src={it.iconUrl}
                alt={it.name}
                style={{
                  maxWidth: 28,
                  maxHeight: 28,
                  imageRendering: 'pixelated',
                  objectFit: 'contain'
                }}
                draggable={false}
              />
            )}
            {it && it.quantity > 1 && <span className="dr-orig-slot-qty">{it.quantity}</span>}
          </button>
        );
      })}

      {/* Field 0: SPELL Button at (13, 323, 71x25) -> normal=2, hover=3, press=4 */}
      <div
        onMouseEnter={() => {
          soundManager.playTouch();
          setHoverBtn('spell');
        }}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('spell')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          soundManager.playClick();
          onOpenWindow('spells');
        }}
        style={{
          position: 'absolute',
          left: 13,
          top: 323,
          width: 71,
          height: 25,
          backgroundImage: `url('${INV_SPRITE(
            pressBtn === 'spell' ? 4 : hoverBtn === 'spell' ? 3 : 2
          )}')`,
          backgroundSize: '71px 25px',
          cursor: 'pointer'
        }}
      />

      {/* Field 23: Scroll Down / Prev Page Button at (132, 324, 34x23) -> normal=11, hover=12, press=13 */}
      <div
        onMouseEnter={() => {
          soundManager.playTouch();
          setHoverBtn('down');
        }}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('down')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          soundManager.playClick();
          setBagPage((p) => (p + 1) % 3);
        }}
        style={{
          position: 'absolute',
          left: 132,
          top: 324,
          width: 34,
          height: 23,
          backgroundImage: `url('${INV_SPRITE(
            pressBtn === 'down' ? 13 : hoverBtn === 'down' ? 12 : 11
          )}')`,
          backgroundSize: '34px 23px',
          cursor: 'pointer'
        }}
      />

      {/* Field 22: Scroll Up / Next Page Button at (168, 324, 34x23) -> normal=8, hover=9, press=10 */}
      <div
        onMouseEnter={() => {
          soundManager.playTouch();
          setHoverBtn('up');
        }}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('up')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          soundManager.playClick();
          setBagPage((p) => Math.max(0, p - 1));
        }}
        style={{
          position: 'absolute',
          left: 168,
          top: 324,
          width: 34,
          height: 23,
          backgroundImage: `url('${INV_SPRITE(
            pressBtn === 'up' ? 10 : hoverBtn === 'up' ? 9 : 8
          )}')`,
          backgroundSize: '34px 23px',
          cursor: 'pointer'
        }}
      />

      {/* Field 2: DONE Button at (244, 323, 71x25) -> normal=5, hover=6, press=7 */}
      <div
        onMouseEnter={() => {
          soundManager.playTouch();
          setHoverBtn('done');
        }}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('done')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          soundManager.playMenuClose();
          onClose();
        }}
        style={{
          position: 'absolute',
          left: 244,
          top: 323,
          width: 71,
          height: 25,
          backgroundImage: `url('${INV_SPRITE(
            pressBtn === 'done' ? 7 : hoverBtn === 'done' ? 6 : 5
          )}')`,
          backgroundSize: '71px 25px',
          cursor: 'pointer'
        }}
      />

      {/* Authentic Dragon Raja TxtBgBlack Floating Item Explanation Tooltip (ItemExplain) */}
      {hoveredItem && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(130, Math.max(8, hoveredItem.x - 40)),
            top: Math.max(8, hoveredItem.y - 84),
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
          <div style={{ color: '#ffff66', fontWeight: 700 }}>
            {hoveredItem.item.name}{' '}
            {hoveredItem.item.grade > 0 ? `[G${hoveredItem.item.grade}]` : ''}
          </div>
          {hoveredItem.item.attackMax > 0 && (
            <div>
              Damage: {hoveredItem.item.attackMin} ~ {hoveredItem.item.attackMax}
            </div>
          )}
          {hoveredItem.item.defense > 0 && <div>Defense (AC): +{hoveredItem.item.defense}</div>}
          {hoveredItem.item.hpRestore > 0 && (
            <div style={{ color: '#4ade80' }}>HP Restore: +{hoveredItem.item.hpRestore}</div>
          )}
          {hoveredItem.item.mpRestore > 0 && (
            <div style={{ color: '#60a5fa' }}>MP Restore: +{hoveredItem.item.mpRestore}</div>
          )}
          <div style={{ color: '#cbd5e1', fontSize: 10 }}>
            Durability: {hoveredItem.item.durability} / {hoveredItem.item.maxDurability}
          </div>
          <div style={{ color: '#fde047', fontSize: 10 }}>
            Value: {hoveredItem.item.price.toLocaleString()} Crit
          </div>
          {hoveredItem.item.rareStats.map((rs) => (
            <div key={rs.id} style={{ color: '#60a5fa', fontSize: 10 }}>
              {rs.explain} (+{rs.value})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
