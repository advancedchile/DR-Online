import React, { useState } from 'react';
import { CRAFTING_RECIPES } from '../../data/worldCatalog';
import { CraftingRecipe, JobSkillEntry } from '../../types/game';

interface JobCraftingWindowProps {
  jobSkills: JobSkillEntry[];
  onCraftRecipe: (recipe: CraftingRecipe) => void;
  onClose: () => void;
}

export const JobCraftingWindow: React.FC<JobCraftingWindowProps> = ({
  jobSkills,
  onCraftRecipe,
  onClose
}) => {
  const [mode, setMode] = useState<'skill' | 'item'>('skill');

  return (
    /* Pure 1:1 319x352 Original Skill Window (SysMenu.dat[127] / skill_job_bg.png) */
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 160px)',
        top: 'max(15px, calc(50vh - 220px))',
        width: 319,
        height: 352,
        backgroundImage: `url('/assets/original/ui/windows/skill_job_bg.png')`,
        backgroundSize: '319px 352px',
        backgroundRepeat: 'no-repeat',
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Inner Scroll List inside original 319x352 frame (left: 18, top: 52, width: 283, height: 256) */}
      <div
        style={{
          position: 'absolute',
          left: 18,
          top: 52,
          width: 283,
          height: 256,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {mode === 'skill'
          ? jobSkills.map((job) => (
              <div
                key={job.id}
                onClick={() => setMode('item')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 6px',
                  backgroundColor: 'rgba(18, 14, 10, 0.72)',
                  border: '1px solid rgba(107, 83, 44, 0.6)',
                  cursor: 'pointer',
                  fontFamily: 'Tahoma, sans-serif'
                }}
              >
                <img
                  src={job.iconUrl || '/assets/original/icons/skill/s001.png'}
                  alt={job.name}
                  style={{ width: 24, height: 24, imageRendering: 'pixelated' }}
                  draggable={false}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#ffff88', textShadow: '1px 1px 0 #000' }}>
                    {job.name} (Lv.{job.level})
                  </div>
                  <div style={{ fontSize: 10, color: '#d6c7a1', textShadow: '1px 1px 0 #000' }}>
                    {job.gmTitle} • EXP {job.exp}/{job.maxExp}
                  </div>
                </div>
              </div>
            ))
          : CRAFTING_RECIPES.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onCraftRecipe(rec)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px 6px',
                  backgroundColor: 'rgba(18, 14, 10, 0.78)',
                  border: '1px solid rgba(107, 83, 44, 0.65)',
                  cursor: 'pointer',
                  fontFamily: 'Tahoma, sans-serif'
                }}
              >
                <div style={{ fontSize: 11, color: '#ffff88', textShadow: '1px 1px 0 #000' }}>
                  {rec.name} ({rec.jobName} Lv.{rec.reqJobLevel})
                </div>
                <div style={{ fontSize: 10, color: '#cbd5e1', textShadow: '1px 1px 0 #000' }}>
                  {rec.materials.map((m) => `${m.name} x${m.count}`).join(', ')} — Click to Make
                </div>
              </div>
            ))}
      </div>

      {/* Original Bottom Buttons on SysMenu.dat: SKILL (#639), ITEM (#640), DONE (#123) */}
      <img
        src="/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=639"
        alt="Skill"
        draggable={false}
        onClick={() => setMode('skill')}
        style={{
          position: 'absolute',
          left: 16,
          top: 320,
          width: 87,
          height: 23,
          cursor: 'pointer',
          imageRendering: 'pixelated'
        }}
      />
      <img
        src="/api/data0/sprite?path=images/ui/legacy/localized/en/sysmenu.dat&frame=640"
        alt="Item"
        draggable={false}
        onClick={() => setMode('item')}
        style={{
          position: 'absolute',
          left: 110,
          top: 320,
          width: 86,
          height: 23,
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
          left: 226,
          top: 324,
          width: 74,
          height: 15,
          cursor: 'pointer',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};
