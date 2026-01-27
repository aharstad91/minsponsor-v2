# WordPress Design Migration Brainstorm

**Date:** 2026-01-27
**Status:** Ready for planning

## What We're Building

Migrate the visual design from the WordPress site (minspo-28365.jana-osl.servebolt.cloud) to the Next.js application, creating a cohesive brand experience across:

1. **New homepage** matching WordPress layout and style
2. **Updated design system** with WordPress color palette
3. **Header navigation** matching WordPress structure
4. **Restyled existing pages** (support, checkout, listing)

## Why This Approach

- **Brand consistency**: Match the established WordPress design being developed
- **Leverage existing components**: Keep functional React components, update styling
- **Inter font already in use**: No font changes needed
- **Warm, approachable aesthetic**: Scandinavian design with trust-building elements

## Design System Tokens

### Colors (from WordPress CSS variables)

```css
/* Backgrounds */
--color-background: #f5efe6;     /* Warm beige - page background */
--color-surface: #fbf8f3;        /* Cream - cards/surfaces */
--color-krem: #fbf8f3;           /* Same as surface */

/* Brand Colors */
--color-terrakotta: #d97757;     /* Primary CTA - buttons */
--color-terrakotta-dark: #b85d42; /* Hover state */
--color-korall: #f6a586;         /* Accent/secondary */
--color-korall-light: #f9c4b0;   /* Light accent */
--color-korall-dark: #d97757;    /* Same as terrakotta */

/* Text */
--color-text: #3d3228;           /* Primary text - chocolate brown */
--color-text-muted: #5a4d3f;     /* Secondary text */
--color-brun: #3d3228;           /* Same as text */
--color-brun-light: #5a4d3f;     /* Same as muted */

/* Utility */
--color-border: #e8e2d9;         /* Borders/dividers */
--color-softgra: #e8e2d9;        /* Same as border */
--color-success: #4caf50;
--color-error: #e53935;
--color-gul: #f4c85e;            /* Yellow accent */
```

### Typography

```css
--font-body: "Inter", "Source Sans Pro", sans-serif;
--font-heading: "Inter", "DM Sans", sans-serif;

--text-xs: 12px;
--text-small: 14px;
--text-body: 16px;
--text-body-lg: 18px;
--text-h4: 20px;
--text-h3: 28px;
--text-h2: 36px;
--text-h2-section: 48px;
--text-h1: 48px;
--text-h1-hero: 56px;
```

### Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
--spacing-section: 80px;
--spacing-section-lg: 120px;
```

### Border Radius

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-full: 9999px;  /* Pill buttons */
```

### Shadows (warm tones)

```css
--shadow-warm-sm: 0 2px 10px rgba(61,50,40,.06);
--shadow-warm: 0 4px 20px rgba(61,50,40,.08);
--shadow-warm-lg: 0 8px 30px rgba(61,50,40,.12);
--shadow-warm-xl: 0 12px 40px rgba(61,50,40,.15);
```

## Pages to Create/Update

### 1. Homepage (`/`) - NEW

**Sections:**
- Header navigation (logo + links)
- Hero: headline, subtitle, illustration, search bar, CTAs
- "Hvorfor MinSponsor?" - 3 value proposition cards
- "Slik fungerer det" - 4-step process with numbered circles
- CTA section with demo link
- Footer

**Key Elements:**
- Pill-shaped search input with dropdown
- Primary button: terracotta fill, white text, pill shape
- Secondary button: terracotta outline, transparent fill
- Value cards: white background, icon badges with coral bg
- Step indicators: outline circles (1-3), filled for step 4

### 2. Header Navigation - NEW

**Links:**
- Logo (left)
- Finn lag (coral/terracotta active color)
- Om oss
- FAQ
- Kontakt

### 3. Footer - NEW (for all pages)

**Structure:**
- Dark section (brown background)
- 4 columns: Brand, For supportere, For klubber, Om MinSponsor
- Copyright + "Sikker betaling via Stripe"

### 4. Listing Page (`/stott/`) - UPDATE

- Apply beige background
- Update card styles (white bg, warm shadow)
- Coral icon badges for clubs/teams

### 5. Support Pages (`/stott/[org]/...`) - UPDATE

- Hero gradient (coral tones)
- Breadcrumb navigation
- Amount selection: filled buttons for monthly, outline for one-time
- Trust indicators below selection
- Player list in white card

### 6. Checkout (`/checkout`) - UPDATE (restyle only)

- Keep current structure
- Apply new color palette
- Update button to terracotta pill style
- Warm background

### 7. Info Pages - NEW (placeholder)

- `/om-oss` - About page
- `/faq` - FAQ page
- `/kontakt` - Contact page

Simple placeholder pages with header/footer, can be expanded later.

## Illustration Assets

User has the following images available from WordPress:
- `minsponsor-characters.png` - Hero illustration (two figures with heart)
- Icon assets for value cards (heart, star, people)

Location to place: `/public/images/`

## Key Decisions

1. **Scope**: Homepage + update existing pages (not full redesign)
2. **Checkout**: Keep current structure, restyle with new colors
3. **Navigation**: Add header nav matching WordPress
4. **Illustrations**: User will provide image files
5. **Info pages**: Create new placeholder pages for Om oss, FAQ, Kontakt in Next.js
6. **Homepage search**: Functional live search with dropdown results (like WordPress)

## Open Questions

1. Mobile navigation - hamburger menu or simplified?

## Next Steps

1. Run `/workflows:plan` to create implementation plan
2. Update globals.css with design tokens
3. Create shared Header and Footer components
4. Build homepage
5. Update existing page styles
