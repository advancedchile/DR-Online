export type GuideLang = 'es' | 'en';

export interface HelpGuideSection {
  id: string;
  title: Record<GuideLang, string>;
  summary: Record<GuideLang, string>;
  keywords: string[];
  entries: Array<{
    heading: Record<GuideLang, string>;
    body: Record<GuideLang, string[]>;
  }>;
}

export const HELP_GUIDE_SECTIONS: HelpGuideSection[] = [
  {
    id: 'interface',
    title: {
      es: 'Interfaz y Controles',
      en: 'Interface & Controls'
    },
    summary: {
      es: 'Botones principales, barras de vida/maná/hambre y navegación.',
      en: 'Main HUD buttons, Life/Mana/Hunger gauges and navigation.'
    },
    keywords: ['help', 'interfaz', 'interface', 'hud', 'barra', 'life', 'mana', 'divine', 'hunger', 'controles', 'controls', 'map', 'mapa'],
    entries: [
      {
        heading: {
          es: 'Botones centrales de la barra inferior',
          en: 'Center Main Interface Buttons'
        },
        body: {
          es: [
            'En el centro de la interfaz inferior hay 6 botones principales: Hoja de Personaje (A), Inventario (W), Grupo/Party (P), Libro de Magia, Habilidades de Combate y Habilidades Comunes.',
            'En la esquina derecha encontrarás el botón PEACE / BATTLE (tecla TAB) para cambiar entre modo pacífico y combate, el botón MAP (M) para abrir el mapa de la zona, Correo y Opciones del sistema.'
          ],
          en: [
            'There are 6 buttons in the center of the Main Interface: Character Sheet (A), Inventory (W), Party Menu (P), Magic Book, Combat Skills and Common Skills.',
            'On the bottom-right side you will find the PEACE / BATTLE toggle (TAB key), the MAP button (M) to view the area and monsters, Mail, Arena/War menus and System Options.'
          ]
        }
      },
      {
        heading: {
          es: 'Orbes y barras de estado',
          en: 'Status Orbs & Gauges'
        },
        body: {
          es: [
            'Orbe rojo (izquierda): Vida (HP). Se recupera con pociones curativas.',
            'Orbe azul o morado/verde (derecha): Maná (magos) o Poder Divino (sacerdotes). El Maná se recupera con pociones; el Poder Divino se regenera con el tiempo.',
            'Barra amarilla (H): Hambre (SP). Come pan o alimentos para mantenerla llena.',
            'Debajo del hambre se muestran 3 medidores: nivel de Magia, nivel de Táctica de arma y nivel de Habilidad de oficio.'
          ],
          en: [
            'Red orb (left): Life (HP), recovered with Healing Potions.',
            'Blue or Green orb (right): Mana (Wizards) or Divine (Priests). Mana is restored with Mana Potions; Divine recovers naturally over time.',
            'Yellow bar (H): Hunger (SP). Eat bread or cooked dishes to restore it.',
            'Below Hunger are three gauges showing your Magic level, Weapon Tactic level and Job Skill level.'
          ]
        }
      }
    ]
  },
  {
    id: 'classes',
    title: {
      es: 'Clases y Atributos',
      en: 'Classes & Abilities'
    },
    summary: {
      es: 'Guerrero, Arquero, Ladrón, Mago, Sacerdote y cómo repartir puntos.',
      en: 'Warrior, Archer, Thief, Wizard, Priest and primary stat builds.'
    },
    keywords: ['class', 'clase', 'warrior', 'guerrero', 'archer', 'arquero', 'thief', 'ladron', 'wizard', 'mago', 'priest', 'sacerdote', 'str', 'con', 'dex', 'int', 'wis', 'movp', 'ability', 'atributos'],
    entries: [
      {
        heading: {
          es: 'Atributos principales por clase',
          en: 'Primary Abilities by Class'
        },
        body: {
          es: [
            'Guerrero (Warrior): Sube STR y CON para daño cuerpo a cuerpo y vida máxima. Si usas lanzas, añade también DEX.',
            'Arquero (Archer): Sube DEX y MOVP para daño con arcos y velocidad. CON aumenta tu vida máxima.',
            'Ladrón (Thief): Sube DEX y MOVP para dagas, armas arrojadizas y agilidad. Añade CON para resistir más.',
            'Mago (Wizard): Sube INT y WS para aprender y lanzar hechizos poderosos, más CON para vida.',
            'Sacerdote (Priest): Sube WIS y PS para oraciones y curaciones divinas, más CON para vida.'
          ],
          en: [
            'Warrior: Raise STR and CON for melee damage and max Health. Add DEX if you specialize in Spears.',
            'Archer: Raise DEX and MOVP for bow power and movement speed, plus CON for Health.',
            'Thief: Raise DEX and MOVP for daggers, throwing knives and agility, plus CON for Health.',
            'Wizard: Raise INT and WS to learn and cast stronger spells, plus CON for Health.',
            'Priest: Raise WIS and PS for Divine Orisons and healing, plus CON for Health.'
          ]
        }
      },
      {
        heading: {
          es: 'Redistribución de atributos',
          en: 'Ability Redistribution'
        },
        body: {
          es: [
            'Revisa el siguiente arma o hechizo que quieras equipar para saber exactamente cuántos puntos de atributo requiere.',
            'Si cometes un error antes del nivel 100, puedes escribir "/Ability Redistribution" en el chat.'
          ],
          en: [
            'Check the tooltip of the next weapon, armor or spell you want to use to see its exact Ability requirements.',
            'If you made a mistake before Level 100, you can reset points by typing "/Ability Redistribution" in chat.'
          ]
        }
      }
    ]
  },
  {
    id: 'combat',
    title: {
      es: 'Combate y Tácticas',
      en: 'Combat & Tactics'
    },
    summary: {
      es: 'Cómo atacar, modo BATTLE, maestría de armas y habilidades de combate.',
      en: 'How to attack, BATTLE mode, weapon Tactics and Combat Skills.'
    },
    keywords: ['combat', 'combate', 'tactic', 'tactica', 'attack', 'atacar', 'battle', 'peace', 'tab', 'weapon', 'arma', 'dummy', 'maniqui'],
    entries: [
      {
        heading: {
          es: 'Entrar en combate',
          en: 'Entering Battle'
        },
        body: {
          es: [
            'Abre tu Inventario (W) y equipa tu arma en la mano derecha (y escudo o flechas en la izquierda si corresponde).',
            'Pulsa el botón PEACE (o la tecla TAB) para cambiar a modo BATTLE. Luego haz clic izquierdo sobre un monstruo o maniquí de entrenamiento para atacar.'
          ],
          en: [
            'Open Inventory (W) and equip your weapon in the Right Hand (and shield or arrows in the Left Hand when required).',
            'Click PEACE (or press TAB) to switch to BATTLE mode, then Left Click any monster or training mannequin to attack.'
          ]
        }
      },
      {
        heading: {
          es: '¿Qué es la Táctica (Tactic)?',
          en: 'What is Tactic?'
        },
        body: {
          es: [
            'La Táctica representa tu maestría con un tipo de arma o escuela mágica. Cuanto más alta sea tu Táctica, mayor será tu daño y mejores armas podrás equipar.',
            'El botón rojo con la espada blanca (esquina inferior derecha) despliega tus Habilidades de Combate activas.'
          ],
          en: [
            'Tactic measures your mastery with a weapon type or magic school. Higher Tactic increases your attack power and unlocks stronger equipment.',
            'The red square button with a white sword above the right orb opens your active Combat Skills bar.'
          ]
        }
      }
    ]
  },
  {
    id: 'magic',
    title: {
      es: 'Magia y Oraciones',
      en: 'Magic & Orison'
    },
    summary: {
      es: 'Memorizar hechizos, lanzar magias y atajos F1-F8.',
      en: 'Spell memorization, casting spells and F1-F8 bindings.'
    },
    keywords: ['magic', 'magia', 'spell', 'hechizo', 'wizard', 'priest', 'orison', 'magery', 'memorize', 'f1', 'f8'],
    entries: [
      {
        heading: {
          es: 'Cómo lanzar hechizos',
          en: 'How to Cast Spells'
        },
        body: {
          es: [
            'Los Magos usan INT/WS y Magery; los Sacerdotes usan WIS/PS y Orison.',
            'Abre tu Libro de Magia (botón de estrella), selecciona un hechizo y haz clic derecho sobre ti mismo o sobre un enemigo para lanzarlo.',
            'Puedes asignar hechizos a las teclas F1-F8 manteniendo Ctrl + tecla F mientras el ratón está sobre el hechizo.'
          ],
          en: [
            'Wizards use INT/WS and Magery (memorizing spells from their Spell Book); Priests use WIS/PS and Orison.',
            'Open the Spell Menu (star icon), select a spell and Right Click yourself or a target to cast it.',
            'Bind favorite spells to F1-F8 by holding Ctrl + the desired F key while hovering over a spell.'
          ]
        }
      }
    ]
  },
  {
    id: 'leveling',
    title: {
      es: 'Experiencia y Niveles',
      en: 'Experience & Level Up'
    },
    summary: {
      es: 'Subida de nivel, asignación de 10 puntos y Clase Dual (Nv. 105).',
      en: 'Leveling up, spending 10 Ability points and Dual Class (Lv.105).'
    },
    keywords: ['exp', 'experience', 'experiencia', 'level', 'nivel', 'level up', 'dual', 'fame', 'puntos'],
    entries: [
      {
        heading: {
          es: 'Subir de nivel y entrenar rápido',
          en: 'Leveling Up & Efficient Training'
        },
        body: {
          es: [
            'Cada vez que llenas la barra de experiencia subes de nivel y recibes 10 puntos de atributo. Haz clic en el aviso parpadeante "LEVEL UP" para repartirlos.',
            'Para ganar experiencia de forma eficiente, caza monstruos dentro de un rango de 6 niveles respecto al tuyo y forma grupo (Party) con otros jugadores.'
          ],
          en: [
            'Each time your EXP bar reaches 100%, you Level Up and receive 10 Ability points. Click the flashing "LEVEL UP" indicator to spend them.',
            'For optimal EXP gain, hunt monsters within 6 levels of your character and form a Party with other players.'
          ]
        }
      },
      {
        heading: {
          es: 'Clase Dual (Dual Class)',
          en: 'Dual Class'
        },
        body: {
          es: [
            'Al alcanzar el Nivel 105 con 2000 de Fama y una Extreme Stone, puedes combinar tu clase actual con otra para convertirte en Clase Dual, obteniendo título, bonos y símbolo.'
          ],
          en: [
            'Upon reaching Level 105 with 2000 Fame and an Extreme Stone, you can combine your current class with another to unlock Dual Class bonuses, title and symbol.'
          ]
        }
      }
    ]
  },
  {
    id: 'equipment',
    title: {
      es: 'Inventario, Tiendas y Banco',
      en: 'Inventory, Shops & Bank'
    },
    summary: {
      es: 'Equipar objetos, comprar pociones/armas y guardar ítems.',
      en: 'Equipping gear, buying potions/weapons and bank storage.'
    },
    keywords: ['inventory', 'inventario', 'item', 'objeto', 'shop', 'tienda', 'potion', 'pocion', 'bank', 'banco', 'durability'],
    entries: [
      {
        heading: {
          es: 'Gestión de inventario y compras',
          en: 'Managing Inventory & Shops'
        },
        body: {
          es: [
            'Pulsa W para abrir tu Inventario. Haz clic derecho en pociones o comida para usarlas, y arrastra o haz clic en armas y armaduras para equiparlas.',
            'Habla con los maestros de Herrería, Alquimia, Panadería y Tienda de Armas en la guía o en tu ciudad para comprar suministros.'
          ],
          en: [
            'Press W to open Inventory. Right Click potions or food to consume them, or equip weapons and armor into their matching slots.',
            'Speak with Blacksmith, Alchemy, Bakery and Weapon shop masters in Scholium or your nation town to restock supplies.'
          ]
        }
      }
    ]
  },
  {
    id: 'party_guild',
    title: {
      es: 'Grupo (Party) y Gremios',
      en: 'Party & Guilds'
    },
    summary: {
      es: 'Compartir experiencia sin daño aliado y competir en Gremios.',
      en: 'Sharing EXP safely in a Party and joining Guilds.'
    },
    keywords: ['party', 'grupo', 'guild', 'gremio', 'colossus', 'arena', 'emporia'],
    entries: [
      {
        heading: {
          es: 'Sistema de Grupo y Gremios',
          en: 'Party & Guild System'
        },
        body: {
          es: [
            'Abre el menú Party (P) en modo PEACE, mantén Ctrl y arrastra a otro jugador a una ranura (o escribe "/party Nombre") para compartir experiencia sin dañar aliados.',
            'Los Gremios (Guilds) comparten emblema, protección en grupo y pueden competir en la Arena Colossus por honor y clasificación.'
          ],
          en: [
            'Open the Party Menu (P) in PEACE mode, hold Ctrl and drag a player onto a slot (or type "/party Name") to share EXP without friendly fire.',
            'Guild members share a Guild Mark, ally protection and compete in the Colossus Arena for honor and Ladder rank.'
          ]
        }
      }
    ]
  },
  {
    id: 'nations',
    title: {
      es: 'Naciones y Guerras',
      en: 'Three Nations & Wars'
    },
    summary: {
      es: 'Vyseus, Zypern, Yllse y los conflictos del continente.',
      en: 'Vyseus, Zypern, Yllse and continent-wide wars.'
    },
    keywords: ['nation', 'nacion', 'vyseus', 'zypern', 'yllse', 'war', 'guerra', 'castle', 'local', 'snow'],
    entries: [
      {
        heading: {
          es: 'Las Tres Naciones',
          en: 'The Three Nations'
        },
        body: {
          es: [
            'El mundo de Dragon Raja se divide en tres naciones: Vyseus (Helternt / Ma-In), Zypern (Renes) e Yllse (Barantan).',
            'Participa en Local War, Castle War y Snow War (nivel 60 o inferior) para ganar Fama y recompensas para tu nación.'
          ],
          en: [
            'Dragon Raja is divided into three nations: Vyseus (Ma-In), Zypern (Renes) and Yllse (Barantan).',
            'Participate in Local War, Castle War and Snow War (Lv.60 and below) to earn Fame and rewards.'
          ]
        }
      }
    ]
  },
  {
    id: 'jobs',
    title: {
      es: 'Oficios y Crafteo',
      en: 'Job Skills & Crafting'
    },
    summary: {
      es: 'Minería, agricultura, herrería, alquimia, pesca y sastrería.',
      en: 'Mining, farming, smithing, alchemy, fishing and tailoring.'
    },
    keywords: ['job', 'oficio', 'craft', 'mining', 'mineria', 'farming', 'fishing', 'smithing', 'alchemy', 'herreria', 'alquimia'],
    entries: [
      {
        heading: {
          es: 'Habilidades de Oficio',
          en: 'Learning Job Skills'
        },
        body: {
          es: [
            'Además del combate, puedes aprender oficios con los maestros de cada ciudad: Minería, Agricultura, Pesca, Tala, Recolección de Hierbas, Herrería, Alquimia, Carpintería y Sastrería.',
            'Los materiales recolectados se utilizan para fabricar armas, armaduras, pociones y objetos raros.'
          ],
          en: [
            'When taking a break from combat, learn Job Skills from town masters: Mining, Farming, Fishing, Lumberjacking, Herb-Digging, Blacksmithing, Alchemy, Carpentry and Tailoring.',
            'Gathered resources let you craft equipment, potions and rare items.'
          ]
        }
      }
    ]
  },
  {
    id: 'shortcuts',
    title: {
      es: 'Atajos y Comandos',
      en: 'Hotkeys & Chat Commands'
    },
    summary: {
      es: 'Teclas rápidas y comandos útiles del chat.',
      en: 'Keyboard shortcuts and useful chat commands.'
    },
    keywords: ['hotkey', 'atajo', 'shortcut', 'command', 'comando', 'enter', 'esc', 'tab', 'chat', 'whisper'],
    entries: [
      {
        heading: {
          es: 'Teclas rápidas principales',
          en: 'Essential Hotkeys'
        },
        body: {
          es: [
            'TAB: Alternar entre modo PEACE y BATTLE.',
            'A: Abrir Hoja de Personaje / Atributos.',
            'W: Abrir o cerrar Inventario.',
            'P: Abrir menú de Grupo (Party).',
            'M: Abrir o cerrar el Mapa del área.',
            'Enter: Activar/enviar barra de chat.',
            'F1 - F8: Lanzar hechizos o habilidades asignadas.',
            'ESC: Cerrar ventana o modal activo.'
          ],
          en: [
            'TAB: Toggle between PEACE and BATTLE mode.',
            'A: Open Character Sheet / Abilities.',
            'W: Toggle Inventory window.',
            'P: Toggle Party menu.',
            'M: Toggle Area Map.',
            'Enter: Open chat input / send message.',
            'F1 - F8: Cast bound spells or skills.',
            'ESC: Close active window or modal.'
          ]
        }
      }
    ]
  }
];
