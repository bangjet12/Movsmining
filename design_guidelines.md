{
  "brand": {
    "name": "MOVS",
    "design_personality": [
      "terminal-authentic",
      "cypherpunk",
      "Hal-Finney-tribute",
      "minimal-chrome",
      "ASCII-first",
      "mobile-resilient"
    ],
    "north_star": "Faithfully replicate rpow2.com’s ASCII terminal wallet/mining UI, rebranded as MOVS, with bilingual ID/EN toggle and complete mining + wallet + explorer flows. No glossy fintech UI."
  },
  "inspiration_refs": {
    "primary_reference": {
      "url": "https://rpow2.com/",
      "notes": [
        "Signature ASCII box-drawing layout: +-- TITLE ----+ and +-----+ separators",
        "Bracket-link/button style: [[ go to login ]]",
        "Monospace-only, terminal green on near-black",
        "Content reads like a CLI status panel"
      ]
    },
    "secondary_refs": [
      {
        "url": "https://nakamotoinstitute.org/finney/rpow/",
        "use": "Copy tone/wording style for tribute copy; keep it factual and reverent"
      },
      {
        "url": "https://dribbble.com/search/terminal-ui",
        "use": "Micro-interactions inspiration (blink cursor, subtle glow, focus states)"
      }
    ]
  },
  "design_tokens": {
    "color_system": {
      "mode": "dark-terminal",
      "palette": {
        "bg": "#0A0B0A",
        "bg_2": "#0E100E",
        "panel": "#070807",
        "border_dim": "#1E2A1E",
        "border": "#2E4A2E",
        "text": "#D7E6D7",
        "text_dim": "#8FB08F",
        "text_muted": "#5F7A5F",
        "accent": "#00FF66",
        "accent_dim": "#00B84A",
        "warning": "#FFB000",
        "danger": "#FF3030",
        "ok": "#00FF66",
        "link": "#00FF66",
        "selection_bg": "rgba(0,255,102,0.22)"
      },
      "rules": [
        "Single primary accent only: phosphor green (#00FF66).",
        "No gradients anywhere (terminal authenticity + gradient restriction rule).",
        "Use danger red only for errors; amber only for warnings; never as decorative.",
        "Borders are ASCII characters, not rounded cards. Use real borders only as fallback on mobile."
      ],
      "tailwind_mapping": {
        "bg": "bg-[#0A0B0A]",
        "text": "text-[#D7E6D7]",
        "accent": "text-[#00FF66]",
        "border": "border-[#2E4A2E]",
        "muted": "text-[#8FB08F]"
      }
    },
    "typography": {
      "font_stack": {
        "primary": "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        "fallback": "ui-monospace, monospace"
      },
      "google_font": {
        "family": "IBM Plex Mono",
        "weights": [400, 700],
        "import": "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');"
      },
      "case_rules": [
        "Headings: ALL CAPS or lowercase with terminal prefixes (choose one per page and keep consistent).",
        "Section labels: use patterns like '// wallet ::' or '> mining <'.",
        "Numbers: tabular-nums for stable hashrate/balance readouts."
      ],
      "scale": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl",
        "h2": "text-base md:text-lg",
        "body": "text-sm md:text-base",
        "small": "text-xs"
      },
      "tracking": {
        "ui": "tracking-[0.02em]",
        "ascii": "tracking-[0.06em]"
      }
    },
    "spacing": {
      "layout": {
        "page_padding": "px-3 sm:px-6",
        "stack_gap": "gap-3 sm:gap-4",
        "section_gap": "gap-6 sm:gap-8"
      },
      "ascii_density": {
        "rule": "Prefer whitespace over borders; ASCII borders should frame, not clutter."
      }
    },
    "radius": {
      "rule": "No rounded corners for terminal boxes. If a component forces radius, set to 0.",
      "token": "--radius: 0rem"
    },
    "shadows": {
      "rule": "No modern drop shadows. Use subtle text glow only on accent text.",
      "accent_glow": "text-shadow: 0 0 10px rgba(0,255,102,0.25);"
    }
  },
  "global_css_spec": {
    "files_to_adjust": [
      "/app/frontend/src/index.css",
      "/app/frontend/src/App.css"
    ],
    "instructions": [
      "In index.css: replace body font-family with IBM Plex Mono stack; set background to --background and ensure .dark is default.",
      "Set :root tokens to terminal palette (override shadcn defaults).",
      "Add selection styling: ::selection { background: var(--selection-bg); color: var(--foreground); }",
      "Add CRT overlay as optional pseudo-element on body: body::before for scanlines (respect prefers-reduced-motion).",
      "Remove centered App-header patterns; do not center align containers globally."
    ],
    "crt_overlay": {
      "enabled_by_default": true,
      "implementation": {
        "scanlines": "background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,102,0.035) 2px, rgba(0,255,102,0.035) 4px);",
        "vignette": "box-shadow: inset 0 0 80px rgba(0,255,102,0.06);",
        "noise": "Use a tiny CSS noise via multiple radial-gradients OR a lightweight PNG overlay (see asset_urls)."
      },
      "a11y": [
        "Disable flicker animations when prefers-reduced-motion: reduce.",
        "Keep scanline opacity <= 0.05 to preserve readability."
      ]
    }
  },
  "layout_system": {
    "ascii_grid_principle": {
      "rule": "Everything is a terminal panel rendered as preformatted ASCII borders. Inside panels, content is normal HTML but aligned to monospace grid.",
      "container": {
        "max_width": "max-w-5xl",
        "alignment": "mx-auto",
        "mobile": "Panels become stacked; ASCII borders simplify (use top/bottom rules only if needed)."
      }
    },
    "page_shell": {
      "top": "ASCII logo + network status line",
      "middle": "Primary panels (wallet/mining/send/history)",
      "bottom": "Footer status + language toggle pinned bottom-right"
    }
  },
  "components": {
    "component_path": {
      "shadcn": {
        "button": "/app/frontend/src/components/ui/button.jsx",
        "input": "/app/frontend/src/components/ui/input.jsx",
        "tabs": "/app/frontend/src/components/ui/tabs.jsx",
        "table": "/app/frontend/src/components/ui/table.jsx",
        "separator": "/app/frontend/src/components/ui/separator.jsx",
        "switch": "/app/frontend/src/components/ui/switch.jsx",
        "sonner": "/app/frontend/src/components/ui/sonner.jsx",
        "dialog": "/app/frontend/src/components/ui/dialog.jsx",
        "progress": "/app/frontend/src/components/ui/progress.jsx",
        "skeleton": "/app/frontend/src/components/ui/skeleton.jsx"
      },
      "custom_to_create": [
        "/app/frontend/src/components/AsciiBox.jsx",
        "/app/frontend/src/components/AsciiButton.jsx",
        "/app/frontend/src/components/AsciiTable.jsx",
        "/app/frontend/src/components/AsciiProgress.jsx",
        "/app/frontend/src/components/LanguageToggle.jsx",
        "/app/frontend/src/components/TerminalStatusLine.jsx",
        "/app/frontend/src/components/TypewriterText.jsx"
      ]
    },
    "ascii_box": {
      "purpose": "Primary layout primitive that renders +---+ borders and a title line like '+-- WALLET ----+'.",
      "structure": {
        "header": "pre line with title",
        "body": "div with padding",
        "footer": "optional pre line"
      },
      "tailwind": {
        "wrapper": "font-mono text-sm md:text-base text-[#D7E6D7]",
        "pre": "whitespace-pre leading-5 md:leading-6 text-[#00FF66]",
        "body": "px-3 py-2 md:px-4 md:py-3"
      },
      "data_testid": {
        "pattern": "ascii-box-{section}",
        "examples": [
          "ascii-box-wallet",
          "ascii-box-mining-controls"
        ]
      }
    },
    "buttons": {
      "style": "Bracket buttons: [ START ] [ STOP ] and bracket links: [[ go to login ]].",
      "variants": {
        "primary": "text-[#0A0B0A] bg-[#00FF66] hover:bg-[#00E65C] active:bg-[#00CC52]",
        "secondary": "text-[#00FF66] bg-transparent border border-[#2E4A2E] hover:border-[#00FF66]",
        "ghost": "text-[#00FF66] bg-transparent hover:bg-[rgba(0,255,102,0.08)]"
      },
      "shape": "square edges, no radius",
      "motion": [
        "Hover: invert colors (terminal highlight).",
        "Active: scale-95 (press).",
        "Focus: outline via ring in accent color."
      ],
      "tailwind_base": "rounded-none font-mono tracking-[0.06em] uppercase",
      "data_testid_examples": [
        "mining-start-button",
        "mining-stop-button",
        "login-request-magic-link-button",
        "send-submit-button"
      ]
    },
    "inputs": {
      "style": "Terminal prompt inputs with leading '>' label and caret-like focus.",
      "tailwind": "rounded-none bg-[#070807] border border-[#2E4A2E] text-[#D7E6D7] placeholder:text-[#5F7A5F] focus-visible:ring-1 focus-visible:ring-[#00FF66]",
      "patterns": [
        "Email field: '> email:' label left, input right.",
        "Amount field: fixed-width, tabular-nums.",
        "Address field: monospace, allow wrap on mobile."
      ],
      "data_testid_examples": [
        "login-email-input",
        "send-to-input",
        "send-amount-input"
      ]
    },
    "tabs": {
      "style": "ASCII tab row: [ MINE ] [ WALLET ] [ SEND ] [ HISTORY ]",
      "shadcn_usage": "Use shadcn Tabs but restyle triggers to look like bracket buttons.",
      "data_testid": {
        "tabs_root": "dashboard-tabs",
        "tab_trigger": "dashboard-tab-{name}"
      }
    },
    "tables": {
      "style": "ASCII bordered tables with | separators; keep columns minimal on mobile.",
      "shadcn_usage": "Use shadcn Table for semantics; wrap with AsciiBox and add a pre header/footer rule.",
      "responsive": [
        "On mobile: hide low-priority columns (hash, full address) and show truncated values.",
        "Provide copy button for hashes/addresses."
      ],
      "data_testid_examples": [
        "tx-history-table",
        "leaderboard-table",
        "recent-blocks-table"
      ]
    },
    "progress": {
      "style": "ASCII progress bar: [████████░░░░] 67%",
      "implementation": "Custom AsciiProgress component; do not rely on gradient progress.",
      "data_testid": "hashrate-progress"
    },
    "toasts": {
      "library": "sonner",
      "style": "Toast content should look like terminal logs: '[OK] ...' '[ERR] ...'",
      "data_testid": "toast-region"
    }
  },
  "micro_interactions": {
    "principles": [
      "Terminal output feel > modern easing.",
      "Use step-based animations (typewriter) sparingly for headings/status, not for long text.",
      "No universal transition: never transition: all."
    ],
    "effects": {
      "blinking_cursor": {
        "css": "@keyframes cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }",
        "usage": "Append a <span className='inline-block w-[0.6ch] bg-[#00FF66] align-[-2px] animate-[cursorBlink_1s_steps(1)_infinite]'> </span> to active prompt lines.",
        "a11y": "Disable when prefers-reduced-motion."
      },
      "typewriter": {
        "usage": "TypewriterText for MOVS logo line and short status lines.",
        "css_hint": "Use steps() timing; keep duration <= 900ms for short strings."
      },
      "stat_tick": {
        "usage": "Animate numbers (hashrate, block height) with subtle tick (no bouncing).",
        "implementation": "requestAnimationFrame count-up or react-spring optional; keep minimal."
      },
      "block_found": {
        "celebration": "Text-only: flash '[FOUND]' line + brief invert of the mining panel border for 250ms.",
        "sound": "Optional off by default; if added, provide toggle and respect user gesture."
      }
    }
  },
  "page_level_blueprints": {
    "routes": {
      "/": {
        "layout": [
          "Top: ASCII MOVS logo (pre) + one-line network status",
          "Panels: NETWORK STATS, ABOUT, HOW TO MINE (short), CTA panel with [[ go to login ]]",
          "Bottom: language toggle + footer status"
        ],
        "ascii_sketch": "MOVS :: reusable proof-of-work tribute\n+-- NETWORK STATS ----------------------------------------------+\n| total supply: 1,000,000                                      |\n| mined: 123,456  (12.34%)                                     |\n| reward: 0.50 MOVS/block                                      |\n| height: 000123                                               |\n| difficulty: 28                                               |\n+--------------------------------------------------------------+\n\n+-- ABOUT ------------------------------------------------------+\n| a terminal-style mining network. tribute to hal finney (2004) |\n+--------------------------------------------------------------+\n\n[[ go to login ]]"
      },
      "/login": {
        "layout": [
          "Single centered-ish panel but left-aligned text inside",
          "Email input + [ REQUEST LINK ]",
          "Below: 'verifying...' log area (pre)"
        ],
        "states": [
          "Idle: prompt",
          "Submitting: show '[...] sending magic link' + blinking cursor",
          "Success: '[OK] check your inbox'",
          "Error: '! error :: invalid email'"
        ]
      },
      "/verify": {
        "layout": [
          "Minimal panel: '[...] verifying token'",
          "Auto redirect to /dashboard",
          "If fail: show retry link"
        ]
      },
      "/dashboard": {
        "layout": [
          "Header: MOVS logo small + address snippet + [ LOGOUT ]",
          "Tabs row: [ MINE ] [ WALLET ] [ SEND ] [ HISTORY ]",
          "Tab panels are AsciiBox sections"
        ],
        "mine_tab": [
          "Mining controls: [ START ] [ STOP ]",
          "Live hashrate + ASCII progress bar",
          "Current challenge (monospace hash), blocks mined, last hash found",
          "Log stream panel (scroll)"
        ],
        "wallet_tab": [
          "Address (copy), balance, total mined",
          "Network stats mini"
        ],
        "send_tab": [
          "To: address/email, Amount, [ SEND ]",
          "Fee/notes line"
        ],
        "history_tab": [
          "Tx table: type, amount, counterparty, time, status"
        ]
      },
      "/leaderboard": {
        "layout": [
          "AsciiBox: TOP MINERS",
          "Table: rank, miner, total mined, hashrate (optional)"
        ]
      },
      "/explorer": {
        "layout": [
          "AsciiBox: RECENT BLOCKS",
          "Table: height, miner, reward, hash (truncate), time",
          "Optional: search input for block height/hash"
        ]
      }
    }
  },
  "tailwind_css_patterns": {
    "base_classes": {
      "page": "min-h-dvh bg-[#0A0B0A] text-[#D7E6D7] font-mono",
      "container": "mx-auto max-w-5xl px-3 sm:px-6",
      "mono_numbers": "tabular-nums",
      "dim": "text-[#8FB08F]",
      "muted": "text-[#5F7A5F]",
      "accent": "text-[#00FF66]",
      "rule": "border-t border-[#2E4A2E]"
    },
    "focus": {
      "rule": "Always visible focus ring",
      "classes": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B0A]"
    },
    "hover": {
      "classes": "transition-colors duration-150",
      "note": "Do not use transition-all."
    }
  },
  "i18n": {
    "languages": ["id", "en"],
    "toggle_ui": "[ ID | EN ]",
    "placement": "fixed bottom-3 right-3",
    "data_testid": "language-toggle",
    "copy_tone": {
      "id": "ringkas, teknis, gaya terminal",
      "en": "short, technical, terminal-like"
    }
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast: ensure dim text still readable on #0A0B0A.",
      "Keyboard navigation: tab order follows panels top-to-bottom.",
      "prefers-reduced-motion: disable cursor blink/typewriter/scanline animation.",
      "Do not rely on color alone for status: prefix with [OK]/[WARN]/[ERR]."
    ]
  },
  "asset_urls": {
    "image_urls": [
      {
        "category": "texture",
        "description": "Optional subtle noise overlay (very low opacity) to avoid flat black.",
        "url": "https://grainy-gradients.vercel.app/noise.svg"
      }
    ]
  },
  "mining_specific_ui": {
    "hashrate_bar": {
      "format": "hashrate: 12.34 kh/s  [████████░░░░░░░░] 33%",
      "chars": {
        "filled": "█",
        "empty": "░"
      },
      "data_testid": "mining-hashrate-readout"
    },
    "challenge_display": {
      "format": "challenge: 0xabc...",
      "interaction": "Provide copy button",
      "data_testid": "mining-challenge"
    },
    "log_stream": {
      "format": "[time] [OK] submitted share ...",
      "behavior": "Auto-scroll with pause-on-hover",
      "data_testid": "mining-log-stream"
    }
  },
  "instructions_to_main_agent": [
    "Default the app to dark mode and override shadcn tokens in index.css to the MOVS terminal palette.",
    "Implement an AsciiBox component that renders the +-- TITLE ----+ header line and bottom border using <pre> with whitespace-pre.",
    "Restyle shadcn Button/Input/Tabs/Table to be square, monospace, and bracket/ASCII themed.",
    "Ensure every interactive element and key info readout has a stable data-testid (kebab-case).",
    "No gradients, no rounded cards, no modern shadows. Use only subtle accent text glow.",
    "Bilingual toggle must be present on every route (fixed bottom-right).",
    "Mobile: collapse tables and simplify ASCII borders; keep readability first."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
