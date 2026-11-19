import React from 'react';
import { EXTRACTED_DATA } from '../../data/worldCatalog';
import {
  AchievementEntry,
  ActiveWindowId,
  ArenaLeaderboardEntry,
  BaseAttributes,
  ClassId,
  CombatSkillEntry,
  CraftingRecipe,
  ElementalResists,
  GameItem,
  GameOptionsState,
  JobSkillEntry,
  MailEntry,
  MapDefinition,
  NationId,
  NationWarState,
  SpellEntry,
  TacticEntry
} from '../../types/game';
import { AchievementsWindow } from './AchievementsWindow';
import { ArenaWarWindow } from './ArenaWarWindow';
import { CharacterSheetWindow } from './CharacterSheetWindow';
import { CombatSkillsWindow } from './CombatSkillsWindow';
import { InventoryWindow } from './InventoryWindow';
import { JobCraftingWindow } from './JobCraftingWindow';
import { LegendWorkshopWindow } from './LegendWorkshopWindow';
import { MailWindow } from './MailWindow';
import { NpcVendorWindow } from './NpcVendorWindow';
import { OptionMenuWindow } from './OptionMenuWindow';
import { PartyGuildWindow } from './PartyGuildWindow';
import { SpellbookWindow } from './SpellbookWindow';
import { WorldMapWindow } from './WorldMapWindow';

export interface WindowManagerProps {
  activeWindow: ActiveWindowId | null;
  onCloseWindow: () => void;
  onOpenWindow: (win: ActiveWindowId) => void;
  playerName: string;
  playerNation: NationId;
  playerClass: ClassId;
  dualClass: string;
  dualGrade: number;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  fame: number;
  beatCount: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  dp: number;
  maxDp: number;
  sp: number;
  maxSp: number;
  cp: number;
  maxCp: number;
  statPoints: number;
  attributes: BaseAttributes;
  resists: ElementalResists;
  tactics: TacticEntry[];
  equipped: Partial<Record<string, GameItem>>;
  inventory: GameItem[];
  potionBox: GameItem[];
  spells: SpellEntry[];
  quickSpellId: string;
  combatSkills: CombatSkillEntry[];
  quickCombatSkillId: string;
  jobSkills: JobSkillEntry[];
  achievements: AchievementEntry[];
  mails: MailEntry[];
  nationWar: NationWarState;
  leaderboard: ArenaLeaderboardEntry[];
  options: GameOptionsState;
  currentMap: MapDefinition;
  isMounted: boolean;
  onChangeNation: (n: NationId) => void;
  onChangeClass: (c: ClassId, dualName: string) => void;
  onAllocateStat: (stat: keyof BaseAttributes, amt: number) => void;
  onGrantBonusPoints: () => void;
  onEquipItem: (item: GameItem) => void;
  onUnequipSlot: (slot: string) => void;
  onUseItem: (item: GameItem, fromPotionBox?: boolean) => void;
  onSellItem: (item: GameItem) => void;
  onBuyCatalogItem: (raw: (typeof EXTRACTED_DATA.items)[number]) => void;
  onRepairAll: () => void;
  onSelectQuickSpell: (sId: string) => void;
  onCastSpell: (sp: SpellEntry) => void;
  onLearnSpell: (sId: string) => void;
  onSelectQuickCombatSkill: (csId: string) => void;
  onUseCombatSkill: (cs: CombatSkillEntry) => void;
  onLearnCombatSkill: (csId: string) => void;
  onCraftRecipe: (rec: CraftingRecipe) => void;
  onUpgradeLegendItem: (slotKey: string) => void;
  onEnchantMantleOrSaddle: (slotKey: 'mantle' | 'saddle') => void;
  onEquipSymbol: (sym: { id: number; name: string; grade: number; statBonus: string }) => void;
  onWarpToMap: (mapId: string) => void;
  onSpawnArenaBoss: () => void;
  onClaimMail: (mailId: string) => void;
  onUpdateOptions: (next: GameOptionsState) => void;
  onToggleMount: () => void;
  onMoveToHometown?: () => void;
  onLogOut?: () => void;
}

export const WindowManager: React.FC<WindowManagerProps> = (props) => {
  const { activeWindow, onCloseWindow } = props;
  if (!activeWindow) return null;

  switch (activeWindow) {
    case 'character':
      return (
        <CharacterSheetWindow
          playerName={props.playerName}
          playerNation={props.playerNation}
          playerClass={props.playerClass}
          dualClass={props.dualClass}
          dualGrade={props.dualGrade}
          level={props.level}
          exp={props.exp}
          maxExp={props.maxExp}
          gold={props.gold}
          fame={props.fame}
          beatCount={props.beatCount}
          hp={props.hp}
          maxHp={props.maxHp}
          mp={props.mp}
          maxMp={props.maxMp}
          sp={props.sp}
          maxSp={props.maxSp}
          statPoints={props.statPoints}
          attributes={props.attributes}
          resists={props.resists}
          tactics={props.tactics}
          equipped={props.equipped}
          jobSkills={props.jobSkills}
          onAllocateStat={props.onAllocateStat}
          onGrantBonusPoints={props.onGrantBonusPoints}
          onChangeNation={props.onChangeNation}
          onChangeClass={props.onChangeClass}
          onOpenWindow={props.onOpenWindow}
          onClose={onCloseWindow}
        />
      );
    case 'inventory':
      return (
        <InventoryWindow
          gold={props.gold}
          equipped={props.equipped}
          inventory={props.inventory}
          potionBox={props.potionBox}
          onEquipItem={props.onEquipItem}
          onUnequipSlot={props.onUnequipSlot}
          onUseItem={props.onUseItem}
          onSellItem={props.onSellItem}
          onRepairAll={props.onRepairAll}
          onOpenWindow={props.onOpenWindow}
          onClose={onCloseWindow}
        />
      );
    case 'spells':
      return (
        <SpellbookWindow
          spells={props.spells}
          quickSpellId={props.quickSpellId}
          onSelectQuickSpell={props.onSelectQuickSpell}
          onCastSpell={props.onCastSpell}
          onLearnSpell={props.onLearnSpell}
          onClose={onCloseWindow}
        />
      );
    case 'combat_skills':
      return (
        <CombatSkillsWindow
          cp={props.cp}
          maxCp={props.maxCp}
          dualClass={props.dualClass}
          dualGrade={props.dualGrade}
          combatSkills={props.combatSkills}
          quickCombatSkillId={props.quickCombatSkillId}
          onSelectQuickCombatSkill={props.onSelectQuickCombatSkill}
          onUseCombatSkill={props.onUseCombatSkill}
          onLearnCombatSkill={props.onLearnCombatSkill}
          onClose={onCloseWindow}
        />
      );
    case 'jobs':
      return (
        <JobCraftingWindow
          jobSkills={props.jobSkills}
          onCraftRecipe={props.onCraftRecipe}
          onClose={onCloseWindow}
        />
      );
    case 'legend_workshop':
      return (
        <LegendWorkshopWindow
          gold={props.gold}
          equipped={props.equipped}
          onUpgradeLegendItem={props.onUpgradeLegendItem}
          onEnchantMantleOrSaddle={props.onEnchantMantleOrSaddle}
          onEquipSymbol={props.onEquipSymbol}
          onClose={onCloseWindow}
        />
      );
    case 'vendor':
      return (
        <>
          <NpcVendorWindow
            gold={props.gold}
            onBuyCatalogItem={props.onBuyCatalogItem}
            onClose={onCloseWindow}
          />
          <InventoryWindow
            gold={props.gold}
            equipped={props.equipped}
            inventory={props.inventory}
            potionBox={props.potionBox}
            onEquipItem={props.onEquipItem}
            onUnequipSlot={props.onUnequipSlot}
            onUseItem={props.onUseItem}
            onSellItem={props.onSellItem}
            onRepairAll={props.onRepairAll}
            onOpenWindow={props.onOpenWindow}
            onClose={onCloseWindow}
          />
        </>
      );
    case 'arena_war':
      return (
        <ArenaWarWindow
          nationWar={props.nationWar}
          leaderboard={props.leaderboard}
          onWarpToMap={props.onWarpToMap}
          onSpawnArenaBoss={props.onSpawnArenaBoss}
          onClose={onCloseWindow}
        />
      );
    case 'party_guild':
      return (
        <PartyGuildWindow
          playerName={props.playerName}
          playerNation={props.playerNation}
          playerClass={props.playerClass}
          dualClass={props.dualClass}
          level={props.level}
          fame={props.fame}
          onChangeNation={props.onChangeNation}
          onClose={onCloseWindow}
        />
      );
    case 'achievements':
      return <AchievementsWindow achievements={props.achievements} onClose={onCloseWindow} />;
    case 'mail':
      return (
        <MailWindow
          mails={props.mails}
          onClaimMail={props.onClaimMail}
          onClose={onCloseWindow}
        />
      );
    case 'world_map':
      return (
        <WorldMapWindow
          currentMap={props.currentMap}
          onWarpToMap={props.onWarpToMap}
          onClose={onCloseWindow}
        />
      );
    case 'options':
      return (
        <OptionMenuWindow
          options={props.options}
          isMounted={props.isMounted}
          onUpdateOptions={props.onUpdateOptions}
          onToggleMount={props.onToggleMount}
          onMoveToHometown={props.onMoveToHometown}
          onLogOut={props.onLogOut}
          onClose={onCloseWindow}
        />
      );
    default:
      return null;
  }
};
