---
date: 2026-01-27
topic: platform-admin-utvidelser
---

# Platform-Admin Utvidelser

## Hva vi bygger

Utvide det eksisterende admin-dashboardet med tre nye hovedfunksjoner:

1. **Finansiell oversikt** - Full kontroll over betalinger, transaksjoner og plattforminntekter
2. **Onboarding-pipeline** - Visuell tracking av klubb-onboarding med 7-steg prosess
3. **Per-org rapporter** - Rapporter som kan genereres og deles med individuelle klubber

## Hvorfor denne tilnærmingen

**Vurderte alternativer:**
- **A: Alt-i-ett Dashboard (valgt)** - Utvid eksisterende admin med nye sider
- B: Separate moduler - Egne mini-apper for hver funksjon
- C: Iterativ - Bygg gradvis etter behov

**Valgt A fordi:**
- Gjenbruker eksisterende UI, auth og infrastruktur
- Én plass for alt - mindre kontekstbytte
- Raskere å implementere
- Passende for lite team

## Nøkkelbeslutninger

### Finansiell oversikt

| Funksjon | Beslutning |
|----------|------------|
| Feilede betalinger | Egen visning med varsling og handlingsmuligheter |
| Transaksjoner | Søkbar liste over alle betalinger |
| Platform-inntekt | Dashboard med MinSponsors gebyr-inntekt |
| Utbetalinger | Status på Stripe payouts til klubber |

**Plassering:** `/admin/finance`

### Onboarding-pipeline

7-steg prosess for klubb-onboarding:

1. **Registrering** - Klubb opprettet i admin (MinSponsor)
2. **Stripe Connect** - Organisasjon har koblet til Stripe (Klubb via lenke)
3. **Vipps-oppsett** - Vipps MSN registrert (Klubb + MinSponsor)
4. **Første gruppe** - Minst én gruppe/lag opprettet
5. **Første utøver** - Minst én person med samtykke
6. **Test-betaling** - Verifisert at betalingsflyt fungerer (MinSponsor)
7. **Go-live** - Klubb deler lenker og starter innsamling

**Implementasjon:**
- Automatisk tracking basert på eksisterende data (Stripe-status, gruppe-count, etc.)
- Manuell markering for steg som krever verifisering (test-betaling, go-live)
- Visuell pipeline-view i admin

**Plassering:** `/admin/onboarding` (oversikt) + status-badges i org-listen

### Per-org rapporter

Rapporter som kan genereres for individuelle klubber:
- MRR og vekst
- Antall aktive sponsorer
- Inntekt per gruppe/utøver
- Betalingsfordeling (Vipps vs Stripe)

**Format:** Kan vises i admin + eksporteres som PDF for deling

**Plassering:** `/admin/organizations/[id]/report`

## Åpne spørsmål

- Skal varsler om feilede betalinger sendes på e-post til MinSponsor-teamet?
- Skal klubber kunne se sine egne rapporter (fremtidig klubb-portal)?
- Hvor lenge skal transaksjonshistorikk vises (alle vs siste 90 dager)?

## Tekniske notater

- Finansdata hentes fra `transactions` og `subscriptions` tabellene
- Onboarding-status kan utledes fra eksisterende data (stripe_account_id, groups count, etc.)
- Rapport-generering kan bruke eksisterende API-endepunkter

## Neste steg

→ Kjør `/workflows:plan` for implementasjonsdetaljer
