import React, { useState } from 'react';
import { originalSoundEngine } from '../../audio/OriginalSoundEngine';
import { AchievementEntry } from '../../types/game';

interface AchievementsWindowProps {
  achievements: AchievementEntry[];
  onClose: () => void;
}

const NATODAYNOTICE_DAT = 'images/ui/legacy/natodaynotice.dat';
const todayNoticeSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(NATODAYNOTICE_DAT)}&frame=${frame}`;

/**
 * 1:1 Authentic MN_NATION_TODAY_NOTICE Window (kh_menuset.cpp:1312)
 * Opened by the HUD "Events / Today's Notice" button at (674, 28) or Ctrl+Z.
 * Uses images/ui/legacy/NaTodaynotice.dat frame 0 (319x352).
 */
export const AchievementsWindow: React.FC<AchievementsWindowProps> = ({
  achievements,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<0 | 1 | 2>(0);
  const [doneHover, setDoneHover] = useState(false);
  const [donePress, setDonePress] = useState(false);

  const tabs: Array<{
    idx: 0 | 1 | 2;
    x: number;
    labelX: number;
    title: string;
    frameNormal: number;
    frameActive: number;
    bodyTitle: string;
    bodyLines: string[];
  }> = [
    {
      idx: 0,
      x: 23,
      labelX: 23,
      title: 'Nation War',
      frameNormal: 4,
      frameActive: 3,
      bodyTitle: '[Nation War & Castle Siege Schedule]',
      bodyLines: [
        '• Border Guard Stone Battle: Daily 20:00',
        '• Vyseus vs Zypern vs Yllse Sanctuary War',
        '• Defend your Nation Sealstones in Renes & Wiseleton.',
        '• Speak to the Guard Captain or press [X] for War Status.'
      ]
    },
    {
      idx: 1,
      x: 120,
      labelX: 120,
      title: 'Monster War',
      frameNormal: 6,
      frameActive: 5,
      bodyTitle: '[Monster Invasion & Colosseum Notice]',
      bodyLines: [
        '• Monster War Defense: Protect the Town Sealstones!',
        '• Beginner Hunting Grounds: Outside Renes City Gates.',
        '• Visit the Hospital Healer for Free Cure below Lv.10.',
        '• Visit the Blacksmith & Skill Guilds to learn Jobs.'
      ]
    },
    {
      idx: 2,
      x: 217,
      labelX: 217,
      title: 'Fame & Quests',
      frameNormal: 8,
      frameActive: 7,
      bodyTitle: '[Hero Fame & Milestones]',
      bodyLines: achievements.map(
        (a) =>
          `• ${a.title}: ${a.unlocked ? 'COMPLETE' : `${a.progress}/${a.goal}`} (+${a.rewardFame} Fame)`
      )
    }
  ];

  const activeTab = tabs[selectedTab];

  return (
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 160px)',
        top: 'max(24px, calc(50vh - 210px))',
        width: 319,
        height: 352,
        backgroundImage: `url('${todayNoticeSprite(0)}')`,
        backgroundSize: '319px 352px',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        zIndex: 85,
        pointerEvents: 'auto',
        userSelect: 'none',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#e8dec5'
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        originalSoundEngine.playMenuClose();
        onClose();
      }}
    >
      {/* Fields 1, 2, 3: 3 Nation Notice Image Banners at (23, 55), (120, 55), (217, 55) (80x56) */}
      {tabs.map((tab) => {
        const isSel = selectedTab === tab.idx;
        return (
          <React.Fragment key={tab.idx}>
            <div
              onMouseEnter={() => originalSoundEngine.playTouch()}
              onClick={() => {
                originalSoundEngine.playClick();
                setSelectedTab(tab.idx);
              }}
              style={{
                position: 'absolute',
                left: tab.x,
                top: 55,
                width: 80,
                height: 56,
                cursor: 'pointer'
              }}
            >
              <img
                src={todayNoticeSprite(isSel ? tab.frameActive : tab.frameNormal)}
                alt=""
                draggable={false}
                style={{
                  width: 80,
                  height: 56,
                  imageRendering: 'pixelated',
                  pointerEvents: 'none'
                }}
              />
            </div>
            {/* Fields 4, 5, 6: Banner Title Labels at y=117 */}
            <div
              style={{
                position: 'absolute',
                left: tab.labelX,
                top: 115,
                width: 80,
                textAlign: 'center',
                fontSize: 10,
                fontWeight: isSel ? 700 : 400,
                color: isSel ? '#ffff77' : '#d6c7a9',
                textShadow: '1px 1px 0 #000',
                pointerEvents: 'none'
              }}
            >
              {tab.title}
            </div>
          </React.Fragment>
        );
      })}

      {/* Field 7: DP_RECT_STRING_PUT_CUSTOM at (33, 148, width=254, height=142) */}
      <div
        style={{
          position: 'absolute',
          left: 33,
          top: 148,
          width: 254,
          height: 142,
          overflowY: 'auto',
          lineHeight: 1.5,
          color: '#f1e5c8',
          textShadow: '1px 1px 0 #000'
        }}
      >
        <div style={{ color: '#ffff88', fontWeight: 700, marginBottom: 6 }}>
          {activeTab.bodyTitle}
        </div>
        {activeTab.bodyLines.map((line, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            {line}
          </div>
        ))}
      </div>

      {/* Field 0: SWD_SMALLMENU_END Close Button at (121, 305, 75x27) - NaTodaynotice.dat[2]/[1] */}
      <div
        onMouseEnter={() => {
          setDoneHover(true);
          originalSoundEngine.playTouch();
        }}
        onMouseLeave={() => {
          setDoneHover(false);
          setDonePress(false);
        }}
        onMouseDown={() => setDonePress(true)}
        onMouseUp={() => setDonePress(false)}
        onClick={() => {
          originalSoundEngine.playMenuClose();
          onClose();
        }}
        style={{
          position: 'absolute',
          left: 121,
          top: 305,
          width: 75,
          height: 27,
          cursor: 'pointer'
        }}
      >
        {(doneHover || donePress) && (
          <img
            src={todayNoticeSprite(donePress ? 1 : 2)}
            alt=""
            draggable={false}
            style={{
              width: 75,
              height: 27,
              imageRendering: 'pixelated',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};
