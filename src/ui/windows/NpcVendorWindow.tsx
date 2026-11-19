import React, { useMemo, useState } from 'react';
import { originalSoundEngine } from '../../audio/OriginalSoundEngine';
import { EXTRACTED_DATA } from '../../data/worldCatalog';

interface NpcVendorWindowProps {
  gold: number;
  onBuyCatalogItem: (raw: (typeof EXTRACTED_DATA.items)[number]) => void;
  onClose: () => void;
}

const SYSMENU_DAT = 'images/ui/legacy/localized/en/sysmenu.dat';
const sysSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(SYSMENU_DAT)}&frame=${frame}`;

export const NpcVendorWindow: React.FC<NpcVendorWindowProps> = ({
  gold,
  onBuyCatalogItem,
  onClose
}) => {
  const [pageIdx, setPageIdx] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoverBtn, setHoverBtn] = useState<'ok' | 'cancel' | 'up' | 'down' | null>(null);
  const [pressBtn, setPressBtn] = useState<'ok' | 'cancel' | 'up' | 'down' | null>(null);

  // Order shop catalog so Weapons, Armors/Shields, Potions, Tools, Accessories, and Food appear first
  const shopCatalog = useMemo(() => {
    const weapons = EXTRACTED_DATA.items.filter((i) => i.category === 'weapon').slice(0, 30);
    const armors = EXTRACTED_DATA.items.filter((i) => i.category === 'armor').slice(0, 30);
    const potions = EXTRACTED_DATA.items.filter((i) => i.category === 'potion').slice(0, 15);
    const tools = EXTRACTED_DATA.items.filter((i) => i.category === 'tool').slice(0, 15);
    const accessories = EXTRACTED_DATA.items.filter((i) => i.category === 'accessory').slice(0, 15);
    const foods = EXTRACTED_DATA.items.filter((i) => i.category === 'food').slice(0, 15);
    const materials = EXTRACTED_DATA.items
      .filter((i) => i.category.startsWith('material_'))
      .slice(0, 30);
    return [...weapons, ...armors, ...potions, ...tools, ...accessories, ...foods, ...materials];
  }, []);

  const pageSize = 15;
  const maxPage = Math.max(0, Math.ceil(shopCatalog.length / pageSize) - 1);
  const items = shopCatalog.slice(pageIdx * pageSize, pageIdx * pageSize + pageSize);
  const selectedItem = items[selectedIdx] || items[0] || null;

  const handleBuySelected = () => {
    if (!selectedItem) return;
    originalSoundEngine.playBuySell(true);
    onBuyCatalogItem(selectedItem);
  };

  return (
    /* Exact SmallMenuSet.cpp:1805 MN_SKILLGUILD_BUY (245x321 SysMenu.dat[609]) */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 400px + 215px)',
        top: 'max(10px, calc(50vh - 300px + 20px))',
        width: 245,
        height: 321,
        backgroundImage: `url('/assets/original/ui/windows/merchant_shop_bg.png')`,
        backgroundSize: '245px 321px',
        backgroundRepeat: 'no-repeat',
        zIndex: 60,
        imageRendering: 'pixelated',
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* nField[0]: Title Banner (67, 8, 100x23) -> SysMenu.dat[610] */}
      <img
        src={sysSprite(610)}
        alt="BUY / SELL"
        draggable={false}
        style={{
          position: 'absolute',
          left: 67,
          top: 8,
          width: 100,
          height: 23,
          imageRendering: 'pixelated',
          pointerEvents: 'none'
        }}
      />

      {/* nField[3]: 5x3 Item Grid at exact SetRect(25, 35, 200, 140) (35px step) */}
      {Array.from({ length: 15 }).map((_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const it = items[i];
        const isSel = selectedIdx === i && Boolean(it);
        const sx = 25 + col * 35;
        const sy = 35 + row * 35;
        return (
          <button
            key={it ? it.id : `shop_empty_${i}`}
            type="button"
            className={`dr-orig-abs-slot ${isSel ? 'selected' : ''}`}
            style={{
              left: sx,
              top: sy,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              originalSoundEngine.playClick();
              setSelectedIdx(i);
            }}
            onDoubleClick={() => {
              if (!it) return;
              originalSoundEngine.playBuySell(true);
              onBuyCatalogItem(it);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!it) return;
              originalSoundEngine.playBuySell(true);
              onBuyCatalogItem(it);
            }}
          >
            {it && it.iconUrl && (
              <img
                src={it.iconUrl}
                alt={it.name}
                style={{
                  maxWidth: 28,
                  maxHeight: 28,
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }}
                draggable={false}
              />
            )}
          </button>
        );
      })}

      {/* nField[6]: Scroll Up Arrow (205, 37, 15x31) -> SysMenu.dat[611/612] */}
      <div
        onMouseEnter={() => setHoverBtn('up')}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('up')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          originalSoundEngine.playClick();
          setPageIdx((p) => Math.max(0, p - 1));
        }}
        style={{
          position: 'absolute',
          left: 205,
          top: 37,
          width: 15,
          height: 31,
          cursor: 'pointer'
        }}
      >
        {(hoverBtn === 'up' || pressBtn === 'up') && (
          <img
            src={sysSprite(pressBtn === 'up' ? 612 : 611)}
            alt=""
            draggable={false}
            style={{ width: 15, height: 31, imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* nField[7]: Scroll Down Arrow (205, 108, 15x31) -> SysMenu.dat[613/614] */}
      <div
        onMouseEnter={() => setHoverBtn('down')}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('down')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          originalSoundEngine.playClick();
          setPageIdx((p) => Math.min(maxPage, p + 1));
        }}
        style={{
          position: 'absolute',
          left: 205,
          top: 108,
          width: 15,
          height: 31,
          cursor: 'pointer'
        }}
      >
        {(hoverBtn === 'down' || pressBtn === 'down') && (
          <img
            src={sysSprite(pressBtn === 'down' ? 614 : 613)}
            alt=""
            draggable={false}
            style={{ width: 15, height: 31, imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* nField[4]: Selected Item Display Box (DP_SELECT_ITEM at x=37, y=168 inside middle display panel) */}
      {selectedItem && (
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 158,
            width: 192,
            height: 78,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 8px',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            color: '#f1e5c8',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {selectedItem.iconUrl && (
              <img
                src={selectedItem.iconUrl}
                alt={selectedItem.name}
                draggable={false}
                style={{
                  maxWidth: 32,
                  maxHeight: 32,
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }}
              />
            )}
          </div>
          <div style={{ lineHeight: '14px', overflow: 'hidden' }}>
            <div
              style={{
                color: '#ffff77',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {selectedItem.name}
            </div>
            <div style={{ color: '#fde047', fontSize: 10 }}>
              Price: {selectedItem.price.toLocaleString()} Crit
            </div>
            {selectedItem.attackMax > 0 && (
              <div style={{ color: '#cbd5e1', fontSize: 10 }}>
                Dmg: {selectedItem.attackMin}~{selectedItem.attackMax}
              </div>
            )}
            {selectedItem.defense > 0 && (
              <div style={{ color: '#cbd5e1', fontSize: 10 }}>AC: +{selectedItem.defense}</div>
            )}
            {selectedItem.hpRestore > 0 && (
              <div style={{ color: '#4ade80', fontSize: 10 }}>HP: +{selectedItem.hpRestore}</div>
            )}
          </div>
        </div>
      )}

      {/* nField[5]: DP_CHARACTER_MONEY at (75, 266) */}
      <div
        className="dr-orig-cs-val"
        style={{
          left: 72,
          top: 264,
          width: 100,
          textAlign: 'right',
          color: '#fde047',
          fontWeight: 700,
          fontSize: 11
        }}
      >
        {gold.toLocaleString()}
      </div>

      {/* nField[1]: OK / BUY Button (23, 252, 39x40) -> SysMenu.dat[294/295] */}
      <div
        title="OK (Buy)"
        onMouseEnter={() => setHoverBtn('ok')}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('ok')}
        onMouseUp={() => setPressBtn(null)}
        onClick={handleBuySelected}
        style={{
          position: 'absolute',
          left: 23,
          top: 252,
          width: 39,
          height: 40,
          cursor: 'pointer'
        }}
      >
        {(hoverBtn === 'ok' || pressBtn === 'ok') && (
          <img
            src={sysSprite(pressBtn === 'ok' ? 295 : 294)}
            alt="OK"
            draggable={false}
            style={{ width: 39, height: 40, imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* nField[2]: CANCEL Button (181, 252, 39x40) -> SysMenu.dat[292/293] */}
      <div
        title="Cancel"
        onMouseEnter={() => setHoverBtn('cancel')}
        onMouseLeave={() => {
          setHoverBtn(null);
          setPressBtn(null);
        }}
        onMouseDown={() => setPressBtn('cancel')}
        onMouseUp={() => setPressBtn(null)}
        onClick={() => {
          originalSoundEngine.playMenuClose();
          onClose();
        }}
        style={{
          position: 'absolute',
          left: 181,
          top: 252,
          width: 39,
          height: 40,
          cursor: 'pointer'
        }}
      >
        {(hoverBtn === 'cancel' || pressBtn === 'cancel') && (
          <img
            src={sysSprite(pressBtn === 'cancel' ? 293 : 292)}
            alt="Cancel"
            draggable={false}
            style={{ width: 39, height: 40, imageRendering: 'pixelated' }}
          />
        )}
      </div>
    </div>
  );
};
