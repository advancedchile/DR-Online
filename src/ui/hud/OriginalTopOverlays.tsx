import React from 'react';
import {
  ActiveWindowId,
  ClassId,
  CombatMode,
  GameOptionsState,
  MapDefinition,
  NationId,
  NationWarState,
  QuestStepDialog,
  WorldEntity
} from '../../types/game';

interface OriginalTopOverlaysProps {
  playerName: string;
  portraitUrl?: string;
  playerNation: NationId;
  playerClass: ClassId;
  dualClass: string;
  dualGrade: number;
  level: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  combatMode: CombatMode;
  playerX: number;
  playerZ: number;
  currentMap: MapDefinition;
  entities: WorldEntity[];
  selectedEntity: WorldEntity | null;
  nationWar: NationWarState;
  activeQuest?: QuestStepDialog;
  options: GameOptionsState;
  onToggleWindow: (win: ActiveWindowId) => void;
  onInteractTarget: (ent: WorldEntity) => void;
  onCastQuickSpell: () => void;
  onUseQuickCombatSkill: () => void;
  onTameTarget: (ent: WorldEntity) => void;
  onPingLocation: () => void;
  onSwitchCharacter?: () => void;
}

export const OriginalTopOverlays: React.FC<OriginalTopOverlaysProps> = ({
  nationWar,
  onToggleWindow
}) => {
  // Per MonsterWarInfos.xml: hidden="true" unless Monster War is active
  if (!nationWar.active) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 332,
        height: 43,
        zIndex: 35,
        cursor: 'pointer',
        userSelect: 'none'
      }}
      onClick={() => onToggleWindow('arena_war')}
    >
      <img
        src="/assets/original/ui/mw/frame.png"
        alt="MonsterWarInfos"
        draggable={false}
        style={{ position: 'absolute', left: 0, top: 0, width: 332, height: 43, imageRendering: 'pixelated' }}
      />
      <img
        src="/assets/original/ui/mw/stone.png"
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: 10, top: 8, width: 23, height: 25, imageRendering: 'pixelated' }}
      />
      <span
        style={{
          position: 'absolute',
          left: 38,
          top: 13,
          color: '#e6e6f2',
          fontSize: 12,
          fontFamily: 'Tahoma, sans-serif',
          textShadow: '1px 1px 0 #000'
        }}
      >
        {nationWar.scores.Vyseus}
      </span>
      <img
        src="/assets/original/ui/mw/guard.png"
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: 118, top: 8, width: 23, height: 25, imageRendering: 'pixelated' }}
      />
      <span
        style={{
          position: 'absolute',
          left: 146,
          top: 13,
          color: '#e6e6f2',
          fontSize: 12,
          fontFamily: 'Tahoma, sans-serif',
          textShadow: '1px 1px 0 #000'
        }}
      >
        {nationWar.scores.Zypern}
      </span>
      <img
        src="/assets/original/ui/mw/door.png"
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: 225, top: 8, width: 23, height: 25, imageRendering: 'pixelated' }}
      />
      <span
        style={{
          position: 'absolute',
          left: 253,
          top: 13,
          color: '#e6e6f2',
          fontSize: 12,
          fontFamily: 'Tahoma, sans-serif',
          textShadow: '1px 1px 0 #000'
        }}
      >
        {nationWar.scores.Yllse}
      </span>
    </div>
  );
};
