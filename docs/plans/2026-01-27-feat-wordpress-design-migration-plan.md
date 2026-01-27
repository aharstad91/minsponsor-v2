---
title: "feat: WordPress Design Migration"
type: feat
date: 2026-01-27
brainstorm: docs/brainstorms/2026-01-27-wordpress-design-migration-brainstorm.md
---

# ✨ feat: WordPress Design Migration

Migrate the visual design from the WordPress site to the Next.js application, creating a cohesive warm Scandinavian brand experience.

## Overview

Update the Next.js app's design system to match the WordPress site (minspo-28365.jana-osl.servebolt.cloud), including:
- New color palette (terracotta, coral, warm beige)
- New homepage with hero, value props, process steps, and live search
- Shared Header and Footer components
- Restyled existing pages (support, checkout, listing)
- New placeholder info pages (Om oss, FAQ, Kontakt)

## Problem Statement / Motivation

The WordPress site has an established warm, approachable Scandinavian design that builds trust. The Next.js app currently uses neutral stone colors which don't match the brand. Users should experience the same visual identity across both platforms.

## Proposed Solution

### Design System Update

Update `globals.css` CSS custom properties with WordPress color tokens:

```css
/* src/app/globals.css - Replace root color scheme */
:root {
  /* Backgrounds */
  --background: #f5efe6;      /* Warm beige - page bg */
  --card: #fbf8f3;            /* Cream - cards/surfaces */

  /* Brand Colors */
  --primary: #d97757;         /* Terracotta - CTA buttons */
  --primary-foreground: #ffffff;
  --accent: #f6a586;          /* Coral - secondary */
  --accent-foreground: #3d3228;

  /* Text */
  --foreground: #3d3228;      /* Chocolate brown */
  --muted-foreground: #5a4d3f; /* Secondary text */

  /* Borders & Utility */
  --border: #e8e2d9;
  --input: #e8e2d9;
  --ring: #d97757;

  /* Status (keep existing) */
  --destructive: #e53935;
  --success: #4caf50;
  --warning: #f4c85e;
}
```

### Component Architecture

```
src/
├── components/
│   ├── header.tsx           # NEW - Site header with nav
│   ├── footer.tsx           # NEW - Site footer
│   ├── search-box.tsx       # NEW - Live search with dropdown
│   ├── ui/
│   │   └── ... (existing - update colors)
│   └── ...
├── app/
│   ├── page.tsx             # UPDATE - New homepage
│   ├── om-oss/page.tsx      # NEW - About page
│   ├── faq/page.tsx         # NEW - FAQ page
│   ├── kontakt/page.tsx     # NEW - Contact page
│   ├── api/
│   │   └── search/route.ts  # NEW - Search API
│   └── ...
└── ...
```

## Technical Considerations

### Color System
- Keep Tailwind v4 CSS custom properties approach
- Map WordPress hex colors to existing token names (--primary, --background, etc.)
- **Disable dark mode** - warm design conflicts with dark aesthetics
- Admin dashboard keeps neutral stone colors (separate concern)

### Search Implementation
- New API route `/api/search` queries Supabase organizations
- Debounced client-side requests (300ms)
- Returns max 10 results with name, slug, category
- Handles Norwegian characters (æ, ø, å)

### Mobile Responsiveness
- Header: Hamburger menu below 768px (md breakpoint)
- Footer: Stack columns vertically on mobile
- Homepage sections: Responsive grid layouts

### Performance
- Hero illustration: Optimize with Next.js Image component
- Search: Debounce + limit results to avoid excessive API calls

## Acceptance Criteria

### Phase 1: Design System Foundation

- [x] Update `globals.css` with WordPress color palette
- [x] Map colors to Tailwind theme tokens
- [x] Remove/disable dark mode for public pages
- [x] Update Button component primary variant to terracotta
- [x] Update Card component to use cream background
- [x] Update Input component border/focus colors
- [x] Verify existing components render correctly with new colors

### Phase 2: Header & Footer Components

**Header (`src/components/header.tsx`):**
- [x] Logo on left (text "MinSponsor")
- [x] Navigation links: Finn lag, Om oss, FAQ, Kontakt
- [x] Active state detection using `usePathname()`
- [x] Active link styled with terracotta color
- [x] Mobile hamburger menu (below md breakpoint)
- [x] Mobile drawer with stacked nav links
- [x] ARIA labels and semantic `<nav>` element

**Footer (`src/components/footer.tsx`):**
- [x] Dark brown background (#3d3228)
- [x] 4-column layout: Brand, For supportere, For klubber, Om MinSponsor
- [x] Copyright with current year
- [x] "Sikker betaling via Stripe" text
- [x] Responsive: stack columns on mobile

### Phase 3: Homepage

**Hero Section:**
- [x] Large headline: "Støtt lokalidretten – enkelt og trygt"
- [x] Subtitle text
- [x] Hero illustration (user provides image)
- [x] Live search box with dropdown
- [x] Primary CTA: "Finn din klubb" (terracotta)
- [x] Secondary CTA: "Registrer klubb" (outline)

**Search Box (`src/components/search-box.tsx`):**
- [x] Pill-shaped input with search icon
- [x] Debounced API calls (300ms)
- [x] Dropdown with matching organizations
- [x] Loading state: "Søker..."
- [x] Empty state: "Ingen lag funnet"
- [x] Error state: "Søk feilet, prøv igjen"
- [x] Keyboard navigation (arrows, enter, escape)
- [x] Click outside closes dropdown
- [x] Navigate to `/stott/[slug]` on selection

**Search API (`src/app/api/search/route.ts`):**
- [x] GET endpoint with `q` query parameter
- [x] Search organizations by name (case-insensitive)
- [x] Return max 10 results: `{ id, name, slug, category }`
- [x] Handle Norwegian characters

**Value Props Section:**
- [x] Heading: "Hvorfor MinSponsor?"
- [x] 3 cards: For deg som støtter, For barna, For klubben
- [x] Each card: icon badge (coral bg) + title + description
- [x] White card background with warm shadow

**Process Steps Section:**
- [x] Heading: "Slik fungerer det"
- [x] 4 numbered steps with circle indicators
- [x] Steps 1-3: outline circle, Step 4: filled terracotta
- [x] Each step: number, title, description

**CTA Section:**
- [x] Demo link: "Se demo: Støtt Gutter 2009"
- [x] Dark background banner

### Phase 4: Existing Pages Styling

**Support Pages (`src/components/support-page.tsx`):**
- [x] Update background to warm beige
- [x] Update cards to cream surface
- [x] Update text colors to chocolate brown
- [x] Add breadcrumb navigation styling
- [x] Monthly buttons: terracotta filled
- [x] One-time buttons: terracotta outline
- [x] Trust indicators with updated colors

**Checkout Page (`src/components/checkout-form.tsx`):**
- [x] Warm beige page background
- [x] Cream card backgrounds
- [x] Terracotta primary button
- [x] Updated input/radio styling
- [x] Keep Vipps/Stripe logos visible

**Listing Page (`src/app/stott/page.tsx` if exists):**
- [x] N/A - Page does not exist (orgs are accessed directly via /stott/[slug])

### Phase 5: Info Pages

**About Page (`src/app/om-oss/page.tsx`):**
- [x] Header + Footer
- [x] Simple content layout
- [x] Mission statement placeholder

**FAQ Page (`src/app/faq/page.tsx`):**
- [x] Header + Footer
- [x] FAQ list or accordion
- [x] Placeholder questions/answers

**Contact Page (`src/app/kontakt/page.tsx`):**
- [x] Header + Footer
- [x] Contact email: hei@minsponsor.no
- [x] Location: Trondheim, Norge

### Phase 6: Integration

- [x] Add Header to all public pages
- [x] Add Footer to all public pages
- [x] Ensure admin pages don't show public Header/Footer
- [x] Test all navigation links work
- [x] Test search on homepage
- [ ] Mobile responsiveness on all pages (manual testing required)
- [ ] Cross-browser testing (Chrome, Firefox, Safari) (manual testing required)

## Implementation Phases

### Phase 1: Design Foundation
**Files:** `globals.css`, `button.tsx`, `card.tsx`, `input.tsx`

Update CSS custom properties and verify component rendering.

### Phase 2: Header & Footer
**Files:** `header.tsx`, `footer.tsx`

Create shared layout components with mobile responsiveness.

### Phase 3: Homepage & Search
**Files:** `page.tsx`, `search-box.tsx`, `api/search/route.ts`

Build homepage sections and implement live search.

### Phase 4: Page Restyling
**Files:** `support-page.tsx`, `checkout-form.tsx`

Apply new color palette to existing components.

### Phase 5: Info Pages
**Files:** `om-oss/page.tsx`, `faq/page.tsx`, `kontakt/page.tsx`

Create placeholder pages with consistent styling.

### Phase 6: Polish & QA
Test responsiveness, accessibility, cross-browser compatibility.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | UPDATE | WordPress color palette |
| `src/components/ui/button.tsx` | UPDATE | Terracotta primary variant |
| `src/components/ui/card.tsx` | UPDATE | Cream background |
| `src/components/header.tsx` | CREATE | Site navigation |
| `src/components/footer.tsx` | CREATE | Site footer |
| `src/components/search-box.tsx` | CREATE | Live search dropdown |
| `src/app/page.tsx` | UPDATE | New homepage |
| `src/app/api/search/route.ts` | CREATE | Search API |
| `src/app/om-oss/page.tsx` | CREATE | About page |
| `src/app/faq/page.tsx` | CREATE | FAQ page |
| `src/app/kontakt/page.tsx` | CREATE | Contact page |
| `src/components/support-page.tsx` | UPDATE | New colors |
| `src/components/checkout-form.tsx` | UPDATE | New colors |
| `src/app/layout.tsx` | UPDATE | Add Header/Footer |

## Dependencies & Prerequisites

- [ ] User provides hero illustration image (`minsponsor-characters.png`)
- [ ] User provides icon assets for value cards (heart, star, people)
- [ ] Images placed in `/public/images/`

## Success Metrics

- All public pages use WordPress color palette
- Homepage matches WordPress layout
- Search returns relevant results within 500ms
- Mobile navigation works on iOS Safari and Chrome
- No accessibility violations (WCAG 2.1 AA)
- Admin dashboard remains unchanged

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Color changes break admin | Admin uses separate layout, test isolation |
| Search performance slow | Debounce, limit results, add DB index |
| Illustration asset missing | Coordinate early, use placeholder if needed |
| Dark mode conflicts | Disable dark mode for public pages |

## References

### Internal
- Brainstorm: `docs/brainstorms/2026-01-27-wordpress-design-migration-brainstorm.md`
- Current styles: `src/app/globals.css`
- Component patterns: `src/components/ui/button.tsx`

### External
- WordPress site: https://minspo-28365.jana-osl.servebolt.cloud/
- Tailwind v4 docs: https://tailwindcss.com/docs
- Radix UI: https://www.radix-ui.com/
