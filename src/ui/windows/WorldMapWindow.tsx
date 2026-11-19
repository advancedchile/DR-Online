import React from 'react';
import { MAPS_CATALOG } from '../../data/worldCatalog';
import { MapDefinition } from '../../types/game';

interface WorldMapWindowProps {
  currentMap: MapDefinition;
  onWarpToMap: (mapId: string) => void;
  onClose: () => void;
}

export const WorldMapWindow: React.FC<WorldMapWindowProps> = ({
  currentMap,
  onWarpToMap,
  onClose
}) => {
  const mapPreviewImg =
    currentMap.id === 'RENES_C'
      ? '/assets/original/ui/maps/renes.png'
      : currentMap.id === 'barantan'
      ? '/assets/original/ui/maps/barantan.png'
      : '/assets/original/ui/maps/map00.png';

  return (
    /* Exact MapDisplay.xml: anchored at TOPLEFT x="10" y="10" */
    <div
      style={{
        position: 'fixed',
        left: 'max(10px, calc(50vw - 390px))',
        top: 'max(10px, calc(50vh - 290px))',
        width: 360,
        height: 260,
        zIndex: 55,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={mapPreviewImg}
        alt={currentMap.name}
        draggable={false}
        onClick={onClose}
        style={{
          width: 360,
          height: 236,
          objectFit: 'fill',
          opacity: 0.86,
          imageRendering: 'pixelated',
          cursor: 'pointer'
        }}
      />

      {/* Map region labels over the map */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxWidth: 344
        }}
      >
        {MAPS_CATALOG.map((m) => (
          <span
            key={m.id}
            onClick={() => onWarpToMap(m.id)}
            style={{
              padding: '1px 5px',
              backgroundColor:
                m.id === currentMap.id ? 'rgba(60, 45, 15, 0.85)' : 'rgba(0, 0, 0, 0.65)',
              border: m.id === currentMap.id ? '1px solid #ffff66' : '1px solid #554422',
              color: m.id === currentMap.id ? '#ffff66' : '#e6dec8',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: 10,
              textShadow: '1px 1px 0 #000',
              cursor: 'pointer'
            }}
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
};
