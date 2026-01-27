---
title: "feat: Platform-Admin Utvidelser"
type: feat
date: 2026-01-27
---

# Platform-Admin Utvidelser

## Overview

Utvide det eksisterende admin-dashboardet med tre nye hovedfunksjoner for å gi MinSponsor-teamet full kontroll over plattformen:

1. **Finansiell oversikt** (`/admin/finance`) - Transaksjoner, feilede betalinger, plattforminntekt
2. **Onboarding-pipeline** (`/admin/onboarding`) - Visuell 7-steg tracking av klubb-onboarding
3. **Per-org rapporter** (`/admin/organizations/[id]/report`) - Delbare rapporter for klubber

## Problem Statement / Motivation

MinSponsor-teamet mangler verktøy for å:
- Se hvilke betalinger som feiler og trenger oppfølging
- Tracke hvor langt klubber har kommet i onboarding-prosessen
- Dele inntektsrapporter med klubbene de hjelper

Uten disse verktøyene må teamet bruke Stripe Dashboard, Excel, og manuell kommunikasjon - ineffektivt og feilutsatt.

## Proposed Solution

Utvide eksisterende admin-dashboard (alt-i-ett tilnærming) med tre nye sider som følger etablerte mønstre i kodebasen.

---

## Technical Considerations

### Arkitektur

- **Gjenbruk eksisterende mønstre**: Server components, supabaseAdmin, shadcn/ui
- **Nye ruter i eksisterende layout**: `/admin/(dashboard)/finance/`, `/admin/(dashboard)/onboarding/`
- **Ny offentlig rute for delte rapporter**: `/reports/[token]/`

### Plattformgebyr-modell

Gebyret legges **på toppen** av donasjonen:
- Supporter betaler: `beløp + (beløp × gebyrprosent)`
- Klubb mottar: `beløp` (100%)
- MinSponsor mottar: `beløp × gebyrprosent`

**Default**: 5%, men konfigurerbar per organisasjon senere.

### Database-endringer

```sql
-- Legg til gebyr-tracking på transaksjoner
ALTER TABLE transactions ADD COLUMN platform_fee INTEGER DEFAULT 0;
-- platform_fee i øre, f.eks. 500 = 5 kr

-- Tabell for delbare rapporter
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indekser for ytelse
CREATE INDEX idx_transactions_status_created ON transactions(status, created_at DESC);
CREATE INDEX idx_transactions_org_created ON transactions(organization_id, created_at DESC);
CREATE INDEX idx_report_shares_token ON report_shares(token);
```

### Onboarding-steg (fra brainstorm)

| Steg | Navn | Auto-deteksjon |
|------|------|----------------|
| 1 | Registrering | `organization` eksisterer |
| 2 | Stripe Connect | `stripe_account_id` ikke null |
| 3 | Vipps-oppsett | `vipps_msn` ikke null |
| 4 | Første gruppe | `groups.count >= 1` |
| 5 | Første utøver | `individuals.count >= 1` |
| 6 | Test-betaling | Manuell markering |
| 7 | Go-live | Manuell markering |

Steg 1-5 beregnes automatisk fra eksisterende data. Steg 6-7 krever manuell markering via nye database-felt:
```sql
ALTER TABLE organizations
  ADD COLUMN test_payment_verified_at TIMESTAMPTZ,
  ADD COLUMN went_live_at TIMESTAMPTZ;
```

---

## Acceptance Criteria

### Fase 1: Finansiell Oversikt (`/admin/finance`)

- [x] **Stats-kort øverst**: Total transaksjonvolum (denne måned), plattformgebyr tjent, fordeling Vipps/Stripe
- [x] **Feilede betalinger-liste**: Tabell med status='failed', viser sponsor_email, org, beløp, dato
- [x] **Transaksjons-liste**: Søkbar/filtrerbar liste over alle transaksjoner
- [x] **Filtrering**: Etter dato-range, betalingsprovider (Vipps/Stripe/Alle), status
- [x] **Paginering**: Server-side, 50 per side
- [x] **Tom tilstand**: Vennlig melding når ingen transaksjoner finnes

### Fase 2: Onboarding-pipeline (`/admin/onboarding`)

- [x] **Pipeline-view**: Visuell 7-kolonne visning med antall orgs per steg
- [x] **Org-liste per steg**: Klikk på steg viser orgs i det steget
- [x] **Org-kort viser**: Navn, dager i steg, kontakt-epost, neste handling
- [x] **Generer Stripe-lenke**: Knapp for å lage/kopiere onboarding-URL
- [x] **Marker steg fullført**: Knapper for "Test-betaling verifisert" og "Go-live"
- [x] **Refresh-status**: Hent oppdatert Stripe-status fra API

### Fase 3: Per-org rapporter (`/admin/organizations/[id]/report`)

- [x] **Rapport-side i admin**: Header med org-navn/logo, stats-kort, breakdown
- [x] **Stats-kort**: Totalt antall sponsorer, MRR, all-time total innsamlet
- [x] **Breakdown**: Per gruppe, per betalingsmetode
- [x] **Siste transaksjoner**: Liste over de 10 siste betalingene
- [x] **Del rapport-knapp**: Genererer delbar URL med token
- [x] **Offentlig rapport-side** (`/reports/[token]`): Samme data, uten admin-nav, uten sensitive data (e-poster)
- [x] **Ugyldig token**: Vennlig feilmelding, ingen dataeksponering

### Navigasjon

- [x] **Sidebar oppdatert**: Nye menypunkter for "Økonomi" og "Onboarding"
- [x] **Rapport-lenke**: Tilgjengelig fra org-detaljer-siden

---

## Implementation Plan

### Fase 1: Database & API (Grunnlag)

#### 1.1 Database-migrering

**Fil**: `supabase/migrations/002_platform_admin_extensions.sql`

```sql
-- Platform fee på transaksjoner
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0;

-- Onboarding-status felt
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS test_payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS went_live_at TIMESTAMPTZ;

-- Delbare rapporter
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_transactions_status_created
  ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_created
  ON transactions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_shares_token
  ON report_shares(token);
```

#### 1.2 Oppdater database-typer

**Fil**: `src/lib/database.types.ts`

Legg til:
- `platform_fee` på Transaction type
- `test_payment_verified_at`, `went_live_at` på Organization type
- Ny `ReportShare` type

#### 1.3 Nye API-ruter

| Rute | Metode | Beskrivelse |
|------|--------|-------------|
| `/api/admin/finance` | GET | Transaksjoner med filtrering/paginering |
| `/api/admin/finance/stats` | GET | Aggregerte stats for dashboard |
| `/api/admin/onboarding` | GET | Orgs gruppert etter onboarding-steg |
| `/api/admin/onboarding/[id]/verify-test` | POST | Marker test-betaling verifisert |
| `/api/admin/onboarding/[id]/go-live` | POST | Marker go-live |
| `/api/admin/organizations/[id]/report` | GET | Rapport-data for org |
| `/api/admin/organizations/[id]/report/share` | POST | Generer delbar lenke |
| `/api/reports/[token]` | GET | Offentlig rapport-data |

---

### Fase 2: Finansiell Oversikt

#### 2.1 Finance-side

**Fil**: `src/app/admin/(dashboard)/finance/page.tsx`

```
/admin/finance
├── Stats-kort (grid 2x2 eller 4x1)
│   ├── Total volum denne måned
│   ├── Plattformgebyr tjent
│   ├── Vipps-andel
│   └── Stripe-andel
├── Feilede betalinger-seksjon
│   ├── Overskrift med antall
│   └── Tabell (sponsor, org, beløp, dato, handling)
└── Alle transaksjoner-seksjon
    ├── Filtre (dato-range, provider, status)
    └── Paginert tabell
```

#### 2.2 Finance API

**Fil**: `src/app/api/admin/finance/route.ts`

Query-params:
- `status`: 'all' | 'succeeded' | 'failed' | 'refunded'
- `provider`: 'all' | 'stripe' | 'vipps'
- `from`: ISO dato
- `to`: ISO dato
- `page`: sidenummer
- `limit`: antall per side (default 50)

---

### Fase 3: Onboarding-pipeline

#### 3.1 Onboarding-side

**Fil**: `src/app/admin/(dashboard)/onboarding/page.tsx`

```
/admin/onboarding
├── Pipeline-header
│   └── 7 kolonner med steg-navn og count
├── Filter-rad
│   └── Vis alle / Bare Stripe / Bare Vipps
└── Org-liste
    ├── Gruppert etter valgt steg (eller alle)
    └── Org-kort med handling-knapper
```

#### 3.2 Onboarding-hjelpefunksjon

**Fil**: `src/lib/onboarding.ts`

```typescript
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  nextAction: string;
  daysInCurrentStep: number;
}

function getOnboardingStatus(
  org: Organization,
  groupCount: number,
  individualCount: number
): OnboardingStatus {
  // Beregn steg basert på data
}
```

---

### Fase 4: Per-org Rapporter

#### 4.1 Rapport-side (admin)

**Fil**: `src/app/admin/(dashboard)/organizations/[id]/report/page.tsx`

```
/admin/organizations/[id]/report
├── Header
│   ├── Org-logo og navn
│   └── "Del rapport"-knapp
├── Stats-kort
│   ├── Aktive sponsorer
│   ├── MRR
│   └── Totalt innsamlet
├── Breakdown-seksjon
│   ├── Per gruppe (tabell)
│   └── Per betalingsmetode (Vipps vs Stripe)
└── Siste transaksjoner
    └── Tabell med 10 siste
```

#### 4.2 Offentlig rapport-side

**Fil**: `src/app/reports/[token]/page.tsx`

- Samme layout som admin-rapport
- Ingen sidebar/admin-navigasjon
- Skjuler sensitive data (e-poster)
- Validerer token mot `report_shares`-tabell
- Viser feilmelding hvis ugyldig/utløpt

#### 4.3 Share-dialog komponent

**Fil**: `src/components/admin/share-report-dialog.tsx`

- Genererer token via API
- Viser kopierbar URL
- Valgfri utløpsdato

---

### Fase 5: Navigasjon & Polish

#### 5.1 Oppdater sidebar

**Fil**: `src/components/admin/admin-layout.tsx`

```typescript
const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organisasjoner', href: '/admin/organizations', icon: Building2 },
  { name: 'Økonomi', href: '/admin/finance', icon: CreditCard },
  { name: 'Onboarding', href: '/admin/onboarding', icon: Users }, // eller Workflow-ikon
];
```

#### 5.2 Lenke til rapport fra org-detaljer

Legg til "Se rapport"-knapp i `OrganizationDetails`-komponenten.

---

## File Changes Summary

### Nye filer

| Fil | Beskrivelse |
|-----|-------------|
| `supabase/migrations/002_platform_admin_extensions.sql` | Database-migrering |
| `src/app/admin/(dashboard)/finance/page.tsx` | Finance-oversikt |
| `src/app/api/admin/finance/route.ts` | Finance API |
| `src/app/api/admin/finance/stats/route.ts` | Stats API |
| `src/app/admin/(dashboard)/onboarding/page.tsx` | Onboarding-pipeline |
| `src/app/api/admin/onboarding/route.ts` | Onboarding API |
| `src/app/api/admin/onboarding/[id]/verify-test/route.ts` | Verify test API |
| `src/app/api/admin/onboarding/[id]/go-live/route.ts` | Go-live API |
| `src/app/admin/(dashboard)/organizations/[id]/report/page.tsx` | Rapport-side |
| `src/app/api/admin/organizations/[id]/report/route.ts` | Rapport API |
| `src/app/api/admin/organizations/[id]/report/share/route.ts` | Share API |
| `src/app/reports/[token]/page.tsx` | Offentlig rapport |
| `src/app/api/reports/[token]/route.ts` | Offentlig rapport API |
| `src/lib/onboarding.ts` | Onboarding-hjelpefunksjoner |
| `src/components/admin/share-report-dialog.tsx` | Share-dialog |

### Endrede filer

| Fil | Endring |
|-----|---------|
| `src/lib/database.types.ts` | Nye typer og felt |
| `src/components/admin/admin-layout.tsx` | Nye navigasjon-items |
| `src/components/admin/organization-details.tsx` | Lenke til rapport |

---

## Dependencies & Risks

### Dependencies

- Database-migrering må kjøres før API-er fungerer
- Eksisterende transaksjonsdata har ikke `platform_fee` - må backfilles eller settes til 0

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Ytelse med mange transaksjoner | Medium | Database-indekser, paginering, caching |
| Token-sikkerhet for rapporter | Medium | Kryptografisk sikre tokens (32+ tegn), utløpsdato |
| Stale onboarding-status | Lav | "Refresh"-knapp for å hente fersk Stripe-status |

---

## Success Metrics

- [ ] Teamet kan se feilede betalinger uten å logge inn på Stripe
- [ ] Onboarding-status for alle klubber synlig på ett sted
- [ ] Klubber kan motta rapport-lenker via e-post

---

## References & Research

### Internal References

- Admin-mønster: `src/app/admin/(dashboard)/page.tsx`
- API-mønster: `src/app/api/admin/organizations/route.ts`
- Database-typer: `src/lib/database.types.ts`
- Validering: `src/lib/validations.ts`

### Brainstorm

- `docs/brainstorms/2026-01-27-platform-admin-utvidelser-brainstorm.md`
