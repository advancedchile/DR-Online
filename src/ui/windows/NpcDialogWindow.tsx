import React, { useState } from 'react';
import { originalSoundEngine } from '../../audio/OriginalSoundEngine';
import { ActiveWindowId, QuestStepDialog, WorldEntity } from '../../types/game';

interface NpcDialogWindowProps {
  npc: WorldEntity | null;
  quest: QuestStepDialog | null;
  onClose: () => void;
  onOpenServiceWindow: (win: ActiveWindowId) => void;
  onHealAndBless: () => void;
  onCompleteQuest: (questId: string) => void;
  onSelectStartingCity?: () => void;
}

const SYSMENU_DAT = 'images/ui/legacy/localized/en/sysmenu.dat';
const SYSMENU2_DAT = 'images/ui/legacy/localized/en/sysmenu2.dat';
const SMALL_ETC_DAT = 'images/ui/legacy/localized/en/small_etc.dat';
const NEW_BANK_DAT = 'images/ui/legacy/localized/en/newbank.dat';

const sysSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(SYSMENU_DAT)}&frame=${frame}`;
const sys2Sprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(SYSMENU2_DAT)}&frame=${frame}`;
const smallEtcSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(SMALL_ETC_DAT)}&frame=${frame}`;
const newBankSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(NEW_BANK_DAT)}&frame=${frame}`;

interface SpriteHotspotProps {
  left: number;
  top: number;
  width: number;
  height: number;
  hoverSrc?: string;
  pressSrc?: string;
  label?: string;
  onClick: () => void;
}

const OriginalMenuHotspot: React.FC<SpriteHotspotProps> = ({
  left,
  top,
  width,
  height,
  hoverSrc,
  pressSrc,
  label,
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const activeImg = pressed ? pressSrc || hoverSrc : hovered ? hoverSrc : undefined;

  return (
    <div
      onMouseEnter={() => {
        setHovered(true);
        originalSoundEngine.playTouch();
      }}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => {
        originalSoundEngine.playClick();
        onClick();
      }}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {activeImg && (
        <img
          src={activeImg}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
            imageRendering: 'pixelated',
            pointerEvents: 'none'
          }}
        />
      )}
      {label && (
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: hovered ? '#ffff77' : '#e8dec5',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
            letterSpacing: '0.4px',
            pointerEvents: 'none'
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

type NpcMenuKind =
  | 'blacksmith'
  | 'farm'
  | 'restaurant'
  | 'herbshop'
  | 'shambles'
  | 'candle'
  | 'slopshop'
  | 'alchemy'
  | 'woodworking'
  | 'bowcraft'
  | 'shipyard'
  | 'magic_guild'
  | 'academy'
  | 'shop_main'
  | 'drink_main'
  | 'heal_main'
  | 'inn_main'
  | 'townhall'
  | 'bank_main'
  | 'quest_book';

function classifyNpcMenu(npc: WorldEntity, hasQuest: boolean): NpcMenuKind {
  const n = (npc.name || '').toLowerCase();
  const sub = (npc.subType || '').toLowerCase();
  const role = npc.npcRole;

  if (n.includes('smith') || n.includes('weapon') || sub === 'npc_blacksmith' || role === 'blacksmith') {
    return 'blacksmith';
  }
  if (n.includes('farm')) return 'farm';
  if (n.includes('bakery') || n.includes('restaurant') || n.includes('cook')) return 'restaurant';
  if (n.includes('herb')) return 'herbshop';
  if (n.includes('shambles') || n.includes('butcher')) return 'shambles';
  if (n.includes('candle')) return 'candle';
  if (n.includes('slop') || n.includes('tailor') || n.includes('cloth')) return 'slopshop';
  if (n.includes('alchemy') || n.includes('alchemist')) return 'alchemy';
  if (n.includes('carpentry') || n.includes('wood')) return 'woodworking';
  if (n.includes('bow')) return 'bowcraft';
  if (n.includes('ship')) return 'shipyard';
  if (n.includes('wizard') || n.includes('magic')) return 'magic_guild';
  if (n.includes('academy') || n.includes('guard') || role === 'war_commander') return 'academy';
  if (n.includes('hospital') || n.includes('priest') || n.includes('healer') || sub === 'npc_priest' || role === 'priest_healer') {
    return 'heal_main';
  }
  if (n.includes('bar') || n.includes('pub') || n.includes('tavern')) return 'drink_main';
  if (n.includes('public house') || n.includes('inn')) return 'inn_main';
  if (n.includes('bank')) return 'bank_main';
  if (n.includes('town') || role === 'legend_sage') return 'townhall';
  if (n.includes('store') || n.includes('merchant') || sub === 'npc_merchant' || role === 'vendor') {
    return 'shop_main';
  }
  if (hasQuest || role === 'quest') {
    return 'quest_book';
  }
  return 'shop_main';
}

export const NpcDialogWindow: React.FC<NpcDialogWindowProps> = ({
  npc,
  quest,
  onClose,
  onOpenServiceWindow,
  onHealAndBless,
  onCompleteQuest,
  onSelectStartingCity
}) => {
  const [forceQuestBook, setForceQuestBook] = useState(false);

  if (!npc) return null;

  const isTutorialNpc =
    npc.title === 'Scholium Tutorial Academy' || Boolean(npc.dialogId?.startsWith('tutorial_'));

  const menuKind: NpcMenuKind =
    forceQuestBook || isTutorialNpc ? 'quest_book' : classifyNpcMenu(npc, Boolean(quest));

  const handleClose = () => {
    originalSoundEngine.playMenuClose();
    setForceQuestBook(false);
    onClose();
  };

  // 1. Original 389x236 Open Quest / Rumor Book (SysMenu.dat[218] / quest_dialog_bg.png)
  if (menuKind === 'quest_book') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 194px)',
          top: 'max(20px, calc(50vh - 160px))',
          width: 389,
          height: 236,
          backgroundImage: `url('/assets/original/ui/windows/quest_dialog_bg.png')`,
          backgroundSize: '389px 236px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          pointerEvents: 'auto',
          userSelect: 'none',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 11,
          color: '#2b1b0e'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-left Red Ribbon EXIT Hotspot (0, 20, 42x40) */}
        <button
          type="button"
          title="EXIT"
          onClick={handleClose}
          style={{
            position: 'absolute',
            left: 0,
            top: 20,
            width: 42,
            height: 40,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        />

        {/* Left Page (52, 50, 142x160) */}
        <div
          style={{
            position: 'absolute',
            left: 52,
            top: 50,
            width: 142,
            height: 160,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ fontWeight: 700, color: '#1e1208' }}>{npc.name}</div>
          {isTutorialNpc ? (
            <>
              <div style={{ fontWeight: 700, color: '#451a03' }}>SCHOLIUM ACADEMY</div>
              <div style={{ fontSize: 10, color: '#3f2712' }}>
                Practice movement, combat on Training Dummies, and inventory management.
              </div>
              {onSelectStartingCity && (
                <div
                  onClick={() => {
                    originalSoundEngine.playClick();
                    handleClose();
                    onSelectStartingCity();
                  }}
                  style={{
                    marginTop: 6,
                    color: '#7f1d1d',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  &gt; Graduate &amp; Select Starting City
                </div>
              )}
              <div
                onClick={() => {
                  originalSoundEngine.playClick();
                  handleClose();
                  onOpenServiceWindow('vendor');
                }}
                style={{
                  marginTop: 2,
                  color: '#451a03',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                &gt; Open Beginner Store
              </div>
            </>
          ) : quest ? (
            <>
              <div style={{ fontWeight: 700, color: '#451a03' }}>{quest.title}</div>
              <div style={{ fontSize: 10, color: '#3f2712' }}>
                Progress: {quest.progress} / {quest.targetCount}
              </div>
              <div style={{ fontSize: 10, color: '#3f2712' }}>
                Reward: {quest.rewardExp} EXP / {quest.rewardGold} Crit
              </div>
              {quest.status !== 'completed' && (
                <div
                  onClick={() => {
                    originalSoundEngine.playClick();
                    onCompleteQuest(quest.id);
                  }}
                  style={{
                    marginTop: 6,
                    color: '#7f1d1d',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  &gt; Complete Quest
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 11, color: '#3f2712' }}>
              [{npc.title || 'Citizen of Helternt'}]
            </div>
          )}
        </div>

        {/* Right Page (212, 38, 152x172) */}
        <div
          style={{
            position: 'absolute',
            left: 212,
            top: 38,
            width: 152,
            height: 172,
            overflowY: 'auto',
            lineHeight: 1.35,
            color: '#2b1b0e'
          }}
        >
          {isTutorialNpc ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <b>Welcome to Scholium!</b>
              </div>
              <div>
                1. Left-click on the ground to walk or run. Press <b>[W]</b> to open your Bag and equip your starter weapon.
              </div>
              <div>
                2. Press <b>[TAB]</b> to enter Battle Mode and attack the Training Dummies along the hall.
              </div>
              <div>
                3. When you are ready to leave the tutorial, click <b>Graduate &amp; Select Starting City</b> or step into the Golden Graduation Gate!
              </div>
            </div>
          ) : quest ? (
            quest.steps.map((p: string, idx: number) => (
              <div key={idx} style={{ marginBottom: 6 }}>
                {p}
              </div>
            ))
          ) : (
            <div>
              Travelers gather in the town square before venturing beyond the gates. Keep your weapons repaired and your belt stocked with potions.
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. General Store (MN_SHOP_MAIN: SysMenu.dat[538] 210x294 + small_etc.dat[1] 162x47 at (24,45))
  if (menuKind === 'shop_main') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 458px)',
          top: 'max(10px, calc(50vh - 300px + 26px))',
          width: 210,
          height: 294,
          backgroundImage: `url('${sysSprite(538)}')`,
          backgroundSize: '210px 294px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shop Sign Overlay: small_etc.dat[1] at (24, 45) */}
        <img
          src={smallEtcSprite(1)}
          alt=""
          draggable={false}
          style={{ position: 'absolute', left: 24, top: 45, width: 162, height: 47 }}
        />
        {/* ITEM BUY (52, 142, 107x30, hover SysMenu.dat[758]) */}
        <OriginalMenuHotspot
          left={52}
          top={142}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="ITEM BUY"
          onClick={() => {
            onClose();
            onOpenServiceWindow('vendor');
          }}
        />
        {/* ITEM SELL (52, 173, 107x30, hover SysMenu.dat[758]) */}
        <OriginalMenuHotspot
          left={52}
          top={173}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="ITEM SELL"
          onClick={() => {
            onClose();
            onOpenServiceWindow('vendor');
          }}
        />
        {/* DONE Button (72, 249, 65x21, hover 492, press 493) */}
        <OriginalMenuHotspot
          left={72}
          top={249}
          width={65}
          height={21}
          hoverSrc={sysSprite(492)}
          pressSrc={sysSprite(493)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 3. Hospital / Temple Healer (MN_HEAL_MAIN: SysMenu.dat[542] 224x302)
  if (menuKind === 'heal_main') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 446px)',
          top: 'max(10px, calc(50vh - 300px + 20px))',
          width: 224,
          height: 302,
          backgroundImage: `url('${sysSprite(542)}')`,
          backgroundSize: '224px 302px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CURE (58, 132, 107x30) */}
        <OriginalMenuHotspot
          left={58}
          top={132}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="CURE"
          onClick={onHealAndBless}
        />
        {/* PREVENTING (58, 163, 107x30) */}
        <OriginalMenuHotspot
          left={58}
          top={163}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="PREVENTING"
          onClick={onHealAndBless}
        />
        {/* LEARN SKILL (58, 194, 107x30) */}
        <OriginalMenuHotspot
          left={58}
          top={194}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="LEARN SKILL"
          onClick={() => {
            onClose();
            onOpenServiceWindow('spells');
          }}
        />
        {/* DONE (77, 253, 65x21, hover 492, press 493) */}
        <OriginalMenuHotspot
          left={77}
          top={253}
          width={65}
          height={21}
          hoverSrc={sysSprite(492)}
          pressSrc={sysSprite(493)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 4. Bar / Pub (MN_DRINK_MAIN: SysMenu.dat[529] 209x293 + small_etc.dat[2] at (21,27))
  if (menuKind === 'drink_main') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 458px)',
          top: 'max(10px, calc(50vh - 300px + 26px))',
          width: 209,
          height: 293,
          backgroundImage: `url('${sysSprite(529)}')`,
          backgroundSize: '209px 293px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={smallEtcSprite(2)}
          alt=""
          draggable={false}
          style={{ position: 'absolute', left: 21, top: 27, width: 164, height: 48 }}
        />
        <OriginalMenuHotspot
          left={51}
          top={123}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="RUMOR"
          onClick={() => setForceQuestBook(true)}
        />
        <OriginalMenuHotspot
          left={51}
          top={158}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="ITEM BUY"
          onClick={() => {
            onClose();
            onOpenServiceWindow('vendor');
          }}
        />
        <OriginalMenuHotspot
          left={66}
          top={240}
          width={73}
          height={26}
          hoverSrc={sysSprite(530)}
          pressSrc={sysSprite(531)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 5. Inn / Public House (MN_INN_MAIN: SysMenu.dat[818] 208x286 + small_etc.dat[3] at (21,27))
  if (menuKind === 'inn_main') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 458px)',
          top: 'max(10px, calc(50vh - 300px + 26px))',
          width: 208,
          height: 286,
          backgroundImage: `url('${sysSprite(818)}')`,
          backgroundSize: '208px 286px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={smallEtcSprite(3)}
          alt=""
          draggable={false}
          style={{ position: 'absolute', left: 21, top: 27, width: 162, height: 54 }}
        />
        <OriginalMenuHotspot
          left={51}
          top={110}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="REST"
          onClick={onHealAndBless}
        />
        <OriginalMenuHotspot
          left={51}
          top={139}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="SLEEP"
          onClick={onHealAndBless}
        />
        <OriginalMenuHotspot
          left={51}
          top={168}
          width={107}
          height={30}
          hoverSrc={sysSprite(758)}
          pressSrc={sysSprite(758)}
          label="LOGOUT"
          onClick={() => {
            onClose();
            onOpenServiceWindow('options');
          }}
        />
        <OriginalMenuHotspot
          left={63}
          top={229}
          width={73}
          height={26}
          hoverSrc={sysSprite(530)}
          pressSrc={sysSprite(531)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 6. Magic Guild (MN_MAGIC_GUILD: SysMenu.dat[491] 210x294)
  if (menuKind === 'magic_guild') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 458px)',
          top: 'max(10px, calc(50vh - 300px + 24px))',
          width: 210,
          height: 294,
          backgroundImage: `url('${sysSprite(491)}')`,
          backgroundSize: '210px 294px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* BUY (31, 138, 148x22, hover 518, press 519) */}
        <OriginalMenuHotspot
          left={31}
          top={138}
          width={148}
          height={22}
          hoverSrc={sysSprite(518)}
          pressSrc={sysSprite(519)}
          onClick={() => {
            onClose();
            onOpenServiceWindow('vendor');
          }}
        />
        {/* LEARN MAGIC (31, 199, 148x22, hover 539, press 540) */}
        <OriginalMenuHotspot
          left={31}
          top={199}
          width={148}
          height={22}
          hoverSrc={sysSprite(539)}
          pressSrc={sysSprite(540)}
          onClick={() => {
            onClose();
            onOpenServiceWindow('spells');
          }}
        />
        {/* EXIT (69, 246, 71x27, hover 607, press 608) */}
        <OriginalMenuHotspot
          left={69}
          top={246}
          width={71}
          height={27}
          hoverSrc={sysSprite(607)}
          pressSrc={sysSprite(608)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 7. Academy (MN_ACADEMY: SysMenu.dat[490] 210x294)
  if (menuKind === 'academy') {
    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 458px)',
          top: 'max(10px, calc(50vh - 300px + 24px))',
          width: 210,
          height: 294,
          backgroundImage: `url('${sysSprite(490)}')`,
          backgroundSize: '210px 294px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEARN SKILL (31, 138, 148x22, hover 601, press 602) */}
        <OriginalMenuHotspot
          left={31}
          top={138}
          width={148}
          height={22}
          hoverSrc={sysSprite(601)}
          pressSrc={sysSprite(602)}
          onClick={() => {
            onClose();
            onOpenServiceWindow('combat_skills');
          }}
        />
        {/* LEARN KNOWLEDGE (31, 199, 148x22, hover 537, press 520) */}
        <OriginalMenuHotspot
          left={31}
          top={199}
          width={148}
          height={22}
          hoverSrc={sysSprite(537)}
          pressSrc={sysSprite(520)}
          onClick={() => {
            onClose();
            onOpenServiceWindow('jobs');
          }}
        />
        {/* EXIT (69, 246, 71x27, hover 607, press 608) */}
        <OriginalMenuHotspot
          left={69}
          top={246}
          width={71}
          height={27}
          hoverSrc={sysSprite(607)}
          pressSrc={sysSprite(608)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 8. Town Hall (MN_TOWNHALL: SysMenu.dat[402] 244x321) & Bank (MN_BANK_MAIN: NewBank.dat[0] 245x320)
  if (menuKind === 'townhall' || menuKind === 'bank_main') {
    const isBank = menuKind === 'bank_main';
    const rows: Array<{ label: string; win: ActiveWindowId }> = isBank
      ? [
          { label: 'DEPOSIT', win: 'inventory' },
          { label: 'DEFRAYAL', win: 'inventory' },
          { label: 'CUSTODY', win: 'inventory' },
          { label: 'LOAN', win: 'character' },
          { label: 'REPAYMENT', win: 'character' },
          { label: 'EXCHANGE BOND', win: 'vendor' }
        ]
      : [
          { label: 'VOTE', win: 'arena_war' },
          { label: 'BUILDING', win: 'jobs' },
          { label: 'GUILD', win: 'party_guild' },
          { label: 'FORUM', win: 'mail' },
          { label: 'EVENT', win: 'achievements' },
          { label: 'RANK', win: 'arena_war' }
        ];

    return (
      <div
        style={{
          position: 'fixed',
          left: 'calc(50vw - 400px + 446px)',
          top: 'max(10px, calc(50vh - 300px + 20px))',
          width: isBank ? 245 : 244,
          height: isBank ? 320 : 321,
          backgroundImage: `url('${isBank ? newBankSprite(0) : sysSprite(402)}')`,
          backgroundSize: isBank ? '245px 320px' : '244px 321px',
          backgroundRepeat: 'no-repeat',
          zIndex: 85,
          imageRendering: 'pixelated',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {rows.map((r, i) => (
          <OriginalMenuHotspot
            key={r.label}
            left={isBank ? 38 : 35}
            top={(isBank ? 70 : 77) + i * 31}
            width={170}
            height={30}
            hoverSrc={sysSprite(16)}
            pressSrc={sysSprite(16)}
            label={isBank ? undefined : r.label}
            onClick={() => {
              onClose();
              onOpenServiceWindow(r.win);
            }}
          />
        ))}
        <OriginalMenuHotspot
          left={isBank ? 89 : 85}
          top={isBank ? 281 : 279}
          width={isBank ? 65 : 72}
          height={22}
          hoverSrc={sysSprite(isBank ? 492 : 403)}
          pressSrc={sysSprite(isBank ? 493 : 404)}
          onClick={handleClose}
        />
      </div>
    );
  }

  // 9. 11 Craft & Trade Guilds (SmallMenuSet.cpp lines 970-1717):
  // Blacksmith (SysMenu 586), Slopshop (SysMenu 592), Woodworking (SysMenu 594), Bowcraft (SysMenu 595), Shipyard (SysMenu 596)
  // Farm (SysMenu2 32), Restaurant/Bakery (SysMenu2 33), Herbshop (SysMenu2 34), Shambles/Butcher (SysMenu2 35), Candle (SysMenu2 36), Alchemy (SysMenu2 37)
  const hasRepair =
    menuKind === 'blacksmith' ||
    menuKind === 'slopshop' ||
    menuKind === 'woodworking' ||
    menuKind === 'bowcraft' ||
    menuKind === 'shipyard';

  const bgImageUrl =
    menuKind === 'farm'
      ? sys2Sprite(32)
      : menuKind === 'restaurant'
      ? sys2Sprite(33)
      : menuKind === 'herbshop'
      ? sys2Sprite(34)
      : menuKind === 'shambles'
      ? sys2Sprite(35)
      : menuKind === 'candle'
      ? sys2Sprite(36)
      : menuKind === 'alchemy'
      ? sys2Sprite(37)
      : menuKind === 'slopshop'
      ? sysSprite(592)
      : menuKind === 'woodworking'
      ? sysSprite(594)
      : menuKind === 'bowcraft'
      ? sysSprite(595)
      : menuKind === 'shipyard'
      ? sysSprite(596)
      : sysSprite(586);

  // Per SmallMenuSet.cpp: guilds with Repair have yBuy=120, ySkill=153, yItem=184, yRepair=214;
  // guilds without Repair (Farm/Bakery/Herb/Shambles/Candle/Alchemy) have yBuy=134, ySkill=167, yItem=198
  const yBuy = hasRepair ? 120 : 134;
  const ySkill = hasRepair ? 153 : 167;
  const yItem = hasRepair ? 184 : 198;

  return (
    <div
      style={{
        position: 'fixed',
        left: 'calc(50vw - 400px + 458px)',
        top: 'max(10px, calc(50vh - 300px + 24px))',
        width: 210,
        height: 294,
        backgroundImage: `url('${bgImageUrl}')`,
        backgroundSize: '210px 294px',
        backgroundRepeat: 'no-repeat',
        zIndex: 85,
        imageRendering: 'pixelated',
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* BUY (31, yBuy, 69x23, hover 597, press 598) */}
      <OriginalMenuHotspot
        left={31}
        top={yBuy}
        width={69}
        height={23}
        hoverSrc={sysSprite(597)}
        pressSrc={sysSprite(598)}
        onClick={() => {
          onClose();
          onOpenServiceWindow('vendor');
        }}
      />

      {/* SELL (110, yBuy, 69x23, hover 599, press 600) */}
      <OriginalMenuHotspot
        left={110}
        top={yBuy}
        width={69}
        height={23}
        hoverSrc={sysSprite(599)}
        pressSrc={sysSprite(600)}
        onClick={() => {
          onClose();
          onOpenServiceWindow('vendor');
        }}
      />

      {/* LEARN SKILL (31, ySkill, 148x22, hover 601, press 602) */}
      <OriginalMenuHotspot
        left={31}
        top={ySkill}
        width={148}
        height={22}
        hoverSrc={sysSprite(601)}
        pressSrc={sysSprite(602)}
        onClick={() => {
          onClose();
          onOpenServiceWindow('jobs');
        }}
      />

      {/* LEARN ITEM (31, yItem, 148x22, hover 603, press 604) */}
      <OriginalMenuHotspot
        left={31}
        top={yItem}
        width={148}
        height={22}
        hoverSrc={sysSprite(603)}
        pressSrc={sysSprite(604)}
        onClick={() => {
          onClose();
          onOpenServiceWindow('jobs');
        }}
      />

      {/* REPAIR (31, 214, 148x22, hover 605, press 606) */}
      {hasRepair && (
        <OriginalMenuHotspot
          left={31}
          top={214}
          width={148}
          height={22}
          hoverSrc={sysSprite(605)}
          pressSrc={sysSprite(606)}
          onClick={() => {
            originalSoundEngine.playForge(true);
            onHealAndBless();
          }}
        />
      )}

      {/* EXIT (69, 246, 71x27, hover 607, press 608) */}
      <OriginalMenuHotspot
        left={69}
        top={246}
        width={71}
        height={27}
        hoverSrc={sysSprite(607)}
        pressSrc={sysSprite(608)}
        onClick={handleClose}
      />
    </div>
  );
};
