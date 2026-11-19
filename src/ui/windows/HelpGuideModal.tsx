import React, { useEffect, useMemo, useState } from 'react';
import { GuideLang, HELP_GUIDE_SECTIONS } from '../../data/helpGuideContent';

interface HelpGuideModalProps {
  open: boolean;
  lang: GuideLang;
  onChangeLang: (lang: GuideLang) => void;
  onClose: () => void;
}

const UI_TEXT = {
  es: {
    title: 'Guía de Ayuda — Dragon Raja Online',
    searchPlaceholder: 'Buscar temas, clases, teclas, comandos...',
    indexTitle: 'Índice',
    noResults: 'No se encontraron temas que coincidan con tu búsqueda.',
    clearSearch: 'Limpiar búsqueda',
    close: 'Cerrar (ESC)',
    resultsCount: (n: number) => `${n} ${n === 1 ? 'sección encontrada' : 'secciones encontradas'}`
  },
  en: {
    title: 'Help Guide — Dragon Raja Online',
    searchPlaceholder: 'Search topics, classes, hotkeys, commands...',
    indexTitle: 'Index',
    noResults: 'No guide topics matched your search.',
    clearSearch: 'Clear search',
    close: 'Close (ESC)',
    resultsCount: (n: number) => `${n} ${n === 1 ? 'section found' : 'sections found'}`
  }
};

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  open,
  lang,
  onChangeLang,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(HELP_GUIDE_SECTIONS[0].id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_GUIDE_SECTIONS;
    return HELP_GUIDE_SECTIONS.filter((sec) => {
      if (sec.title.es.toLowerCase().includes(q) || sec.title.en.toLowerCase().includes(q)) return true;
      if (sec.summary.es.toLowerCase().includes(q) || sec.summary.en.toLowerCase().includes(q)) return true;
      if (sec.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return sec.entries.some(
        (en) =>
          en.heading.es.toLowerCase().includes(q) ||
          en.heading.en.toLowerCase().includes(q) ||
          en.body.es.some((p) => p.toLowerCase().includes(q)) ||
          en.body.en.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const activeSection = useMemo(() => {
    return (
      filteredSections.find((s) => s.id === selectedId) ||
      filteredSections[0] ||
      null
    );
  }, [filteredSections, selectedId]);

  if (!open) return null;

  const t = UI_TEXT[lang];

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(6, 5, 4, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        cursor: 'default'
      }}
    >
      <div
        style={{
          width: 'min(920px, 95vw)',
          height: 'min(620px, 88vh)',
          backgroundColor: '#12100d',
          border: '1px solid #5a492f',
          color: '#f3e8c8',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "Tahoma, Verdana, 'MS Sans Serif', sans-serif",
          fontSize: 13
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            backgroundColor: '#1c1812',
            borderBottom: '1px solid #4a3c26'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: '#e8cf91' }}>{t.title}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language Switcher */}
            <div style={{ display: 'flex', border: '1px solid #5a492f' }}>
              <button
                type="button"
                onClick={() => onChangeLang('es')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  backgroundColor: lang === 'es' ? '#5a4626' : '#18140f',
                  color: lang === 'es' ? '#fff4d4' : '#b7a685',
                  fontWeight: lang === 'es' ? 700 : 400,
                  fontSize: 12
                }}
              >
                ES Español
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderLeft: '1px solid #5a492f',
                  backgroundColor: lang === 'en' ? '#5a4626' : '#18140f',
                  color: lang === 'en' ? '#fff4d4' : '#b7a685',
                  fontWeight: lang === 'en' ? 700 : 400,
                  fontSize: 12
                }}
              >
                EN English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '4px 10px',
                border: '1px solid #6e5938',
                backgroundColor: '#262018',
                color: '#f3e8c8',
                fontSize: 12
              }}
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            backgroundColor: '#16130f',
            borderBottom: '1px solid #352b1c'
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            autoFocus
            style={{
              flex: 1,
              padding: '7px 10px',
              backgroundColor: '#0c0a08',
              border: '1px solid #5a492f',
              color: '#f3e8c8',
              fontSize: 13,
              outline: 'none',
              userSelect: 'text'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                padding: '6px 10px',
                border: '1px solid #5a492f',
                backgroundColor: '#241e16',
                color: '#e0cfa9',
                fontSize: 12
              }}
            >
              {t.clearSearch}
            </button>
          )}
          <span style={{ color: '#a89674', fontSize: 12, whiteSpace: 'nowrap' }}>
            {t.resultsCount(filteredSections.length)}
          </span>
        </div>

        {/* Body: Sidebar Index + Content */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Sidebar Index */}
          <div
            style={{
              width: 245,
              borderRight: '1px solid #352b1c',
              backgroundColor: '#100e0b',
              overflowY: 'auto',
              padding: 8
            }}
          >
            <div
              style={{
                padding: '4px 8px 8px',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#a89674'
              }}
            >
              {t.indexTitle}
            </div>
            {filteredSections.map((sec, idx) => {
              const isSelected = activeSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedId(sec.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    marginBottom: 4,
                    border: isSelected ? '1px solid #8a7045' : '1px solid transparent',
                    backgroundColor: isSelected ? '#272016' : 'transparent',
                    color: isSelected ? '#ffe8a8' : '#d6c6a2',
                    display: 'block',
                    fontSize: 12
                  }}
                >
                  <div style={{ fontWeight: isSelected ? 700 : 600 }}>
                    {idx + 1}. {sec.title[lang]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reading Pane */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              backgroundColor: '#12100d',
              userSelect: 'text'
            }}
          >
            {!activeSection ? (
              <div style={{ color: '#a89674', padding: '24px 0' }}>{t.noResults}</div>
            ) : (
              <div>
                <h2
                  style={{
                    margin: '0 0 6px',
                    fontSize: 18,
                    color: '#f0d694',
                    borderBottom: '1px solid #3a2f1e',
                    paddingBottom: 8
                  }}
                >
                  {activeSection.title[lang]}
                </h2>
                <p style={{ margin: '0 0 16px', color: '#bba882', fontSize: 12 }}>
                  {activeSection.summary[lang]}
                </p>

                {activeSection.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 16,
                      padding: '12px 14px',
                      backgroundColor: '#191510',
                      border: '1px solid #352b1c'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#e6c882' }}>
                      {entry.heading[lang]}
                    </h3>
                    {entry.body[lang].map((line, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          margin: pIdx === 0 ? 0 : '8px 0 0',
                          lineHeight: 1.55,
                          color: '#efe4c8',
                          fontSize: 13
                        }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
