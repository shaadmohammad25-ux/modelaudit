# Design Brief — ModelAudit

**Purpose**: AI ethics SaaS for bias detection and safety auditing. Submit models → receive risk scores, bias flags, remediation guidance.

**Tone**: Authoritative investigative journalism + clinical precision. *The Intercept* meets Swiss audit dashboard. No black boxes. Stamp/seal verdicts. Brutalist dark mode with amber accents.

---

## Palette

| Token | OKLCH | Usage |
| --- | --- | --- |
| Background | 0.065 0 0 | Canvas |
| Foreground | 0.96 0 0 | Text |
| Card | 0.12 0 0 | Panels |
| Primary/Accent | 0.62 0.18 56 | High-risk, CTAs, meters |
| Secondary | 0.48 0.08 250 | Nav, structure |
| Destructive | 0.55 0.22 25 | Critical |

---

## Typography

| Role | Font | Usage |
| --- | --- | --- |
| Display | Fraunces 400–900 | Headlines |
| Body | Lora 400–700 | Copy |
| Mono | JetBrainsMono 400–600 | Scores, timestamps |

LH: Display 1.2, Body 1.6, Mono 1.5.

---

## Zones

| Zone | Styling | Purpose |
| --- | --- | --- |
| Header | `bg-card border-b` | Navigation |
| Main | `bg-background` | Content |
| Panel | `bg-card border` | Data |
| Sidebar | `bg-sidebar border-r` | Nav |
| Footer | `bg-muted/10 border-t` | Legal |

Shadow: `shadow-elevated` (0 8px 16px rgba(0,0,0,0.3)) modals only.

---

## Components

- **Cards**: `bg-card border rounded-sm p-4` + mono scores.
- **Risk badges**: Conditional colors (green/yellow/orange/red) + `text-primary-foreground`.
- **Tables**: Mono, `bg-muted/10` rows, `border-b` dividers.
- **Buttons**: `px-3 py-2 rounded-sm`. Primary: `bg-primary`. Secondary: `border bg-transparent`.
- **Panels**: Animated height, `border-l` accent, mono timestamps.

---

## Motion

1. **Typewriter**: Trail entries fade in (0.6s steps).
2. **Risk meter**: Circular score animates 0→upward (1.2s ease-out).
3. **Panel reveal**: Sections fade + slide (0.3s cubic-bezier).
4. **Verdict stamp**: Badge rotates 15° + scales (0.4s ease-out).
5. **Default**: `transition-smooth` (all 0.3s cubic-bezier) on state changes.

Respects `prefers-reduced-motion`.

---

## A11y

- Contrast: All text ≥ 4.5:1 (WCAG AAA).
- Focus: `ring ring-primary ring-offset-2` on interactive elements.
- Semantic HTML: Headings, paired labels, `aria-live="polite"` for async.
- Keyboard: Tab order matches visual, audit table keyboard-selectable.

---

## Anti-Patterns

❌ Arbitrary hex | ❌ `rounded-lg` on cards | ❌ Multiple shadows | ❌ Animations outside storyboard | ❌ Centered tables

---

## Signature

**Verdict Stamp**: High/critical audits show amber 15° rotated badge with serif text (government approval). Low-risk show green checkmark with steel secondary.

**Typewriter Trail**: Claude processes phases; timestamped entries reveal character-by-character (CSS steps), mimicking typewriter effect.

## Responsive

**Desktop (1024px+)**: Sidebar nav + main + data panels. **Tablet (768–1023px)**: Hamburger nav, single-column. **Mobile (<768px)**: Full-width, stacked, horizontal scroll.
