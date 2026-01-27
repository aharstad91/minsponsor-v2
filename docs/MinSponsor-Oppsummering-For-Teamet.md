# MinSponsor MVP - Oppsummering

**Dato:** Januar 2026
**For:** Emil, Vegard og teamet
**Status:** Klar for utvikling

---

## Hva vi bygger

MinSponsor er en plattform som lar **supportere** (foreldre, besteforeldre, venner) støtte **klubber, lag og enkeltpersoner** med faste månedlige beløp - i stedet for å kjøpe lodd, toalettpapir og kaker.

**Eksempel:**
> Bestemor Kari vil støtte barnebarnet Vidar som spiller håndball i Heimdal IL G2009. Hun går inn på `minsponsor.no/stott/heimdal-handball/g2009/vidar`, velger 100 kr/måned, betaler med Vipps, og ferdig. Vidar får mer tid til trening, og klubben får forutsigbar inntekt.

---

## Hvordan det fungerer

### For supportere (de som gir penger)

1. Får en lenke fra klubben/familien (f.eks. via SMS eller Facebook)
2. Velger beløp (50, 100 eller 200 kr/måned - eller egendefinert)
3. Velger betalingsmetode: **Vipps** (anbefalt) eller kort
4. Betaler - ferdig på under 60 sekunder
5. Penger trekkes automatisk hver måned fra deres konto

### For klubber (de som mottar penger)

1. MinSponsor (dere) oppretter klubben i systemet
2. Klubben fullfører en enkel registrering hos Vipps og Stripe
3. Klubben får sine egne støttesider (lenker de kan dele)
4. Penger går direkte til klubbens bankkonto
5. MinSponsor tar x% i plattformavgift *(må avklares)*

---

## Hvorfor vi bygger det fra bunnen av (ikke med WordPress)

### En analogi

**WordPress med plugins** er likt å kjøpe en **Volkswagen Golf** og så skru på masse aftermarket-deler fra ulike produsenter:
- En turbo fra en leverandør
- En spoiler fra en annen
- Et sound system fra tredje
- Et infotainment-system fra fjerde

Det funker, men:
- Alle delene må snakke sammen (og gjør det ikke alltid)
- Når noen deler må oppdateres, kan andre deler ødelegges
- Hvis du trenger en spesiell kombinasjon av funksjoner, passer ingen av delene perfekt
- Det krever mye vedlikehold

**Next.js / skreddersydd løsning** er likt å **designe og bygge bilen spesifikt for MinSponsor**:
- Alt er laget for akkurat det vi trenger
- Alt snakker sammen fordi det er bygget sammen
- Når vi trenger noe nytt, lager vi det som passer perfekt
- Mindre vedlikehold, færre overraskelser

### Konkret for MinSponsor

| Behov | WordPress | Next.js |
|-------|-----------|---------|
| **Vipps med månedlige betalinger** | Må finne plugin (kanskje ikke så god) | Laget skreddersydd for akkurat dette |
| **Supportere skal betale på <60 sek** | Avhengig av plugin-ytelse | Optimalisert for hastighet |
| **Vipps endrer sitt system** | Venter på at plugin-dev fikser det | Vi fikser det selv (samme dag) |
| **Legge til ny feature for klubber** | Må finne plugin eller gjøre workaround | Enkelt å legge til |
| **Sikkerhet** | Avhengig av mange plugin-utviklere | Kun vår kode, enklere å sikre |
| **Kostnader** | Høyere (trenger mer hosting) | Lavere (enklere løsning) |

### Hva betyr det for dere?

**Med skreddersydd løsning får vi:**
- ✅ **Kontroll:** Ikke avhengig av plugin-utviklere
- ✅ **Hastighet:** Supportere betaler raskere = færre gir opp
- ✅ **Vipps fokus:** Norske supportere elsker Vipps - vi har optimalisert for det
- ✅ **Fleksibilitet:** Når klubber ber om nye features, kan vi legge dem til raskt
- ✅ **Kostnader:** Lavere driftskostnader = mer for dere
- ✅ **Stabilitet:** Færre ting som kan gå galt

**Bunn-linje:** Vi bygger en løsning som er 100% tilpasset MinSponsor, i stedet for å prøve å pakke MinSponsor inn i et generelt system.

---

## Betalingsmetoder

Vi støtter **to betalingsmetoder** fra dag 1:

### Vipps (Primær - anbefalt)
- Nordmenn elsker Vipps - 4.5 millioner brukere
- Bygger tillit ("dette er trygt")
- Perfekt for månedlige betalinger
- Supporter trenger bare telefonnummer

### Kort / Apple Pay (Sekundær)
- For de som ikke vil bruke Vipps
- Fungerer også for engangsstøtte
- Via Stripe (sikker betalingsløsning)

**Viktig:** Vi forventer at 70-80% vil bruke Vipps i Norge.

---

## Hva supportere ser

```
┌─────────────────────────────────────┐
│                                     │
│  Støtt Vidar Samdahl               │
│  Heimdal Håndball G2009            │
│                                     │
│  Velg beløp:                       │
│  ○ 50 kr/mnd                       │
│  ● 100 kr/mnd                      │
│  ○ 200 kr/mnd                      │
│                                     │
│  Betalingsmetode:                  │
│  ● Vipps (Anbefalt)                │
│  ○ Kort / Apple Pay                │
│                                     │
│  Telefonnummer: 47XXXXXXXX         │
│  E-post: bestemor@epost.no         │
│                                     │
│  [ Betal 100 kr/mnd ]              │
│                                     │
│  Gebyr inkludert                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Hvordan klubber kommer i gang

### Steg 1: Dere oppretter klubben
- Navn, organisasjonsnummer, kontaktperson
- Tar 2 minutter

### Steg 2: Klubben aktiverer Stripe (kort-betaling)
- Klubben får en lenke på e-post
- De fyller ut info og kobler bankkonto
- Tar ca. 10 minutter, ofte klart samme dag

### Steg 3: Klubben aktiverer Vipps
- Klubben får en lenke på e-post (med deres info forhåndsutfylt)
- De åpner lenken, bekrefter info og signerer med BankID
- Vipps godkjenner automatisk (3-5 virkedager)
- Dere får automatisk beskjed når Vipps godkjenner, og aktiverer det selv

### Steg 4: Klubben er live!
- Støttesidene fungerer
- Supportere kan betale med både Vipps og kort
- Penger går rett til klubbens konto

---

## Hva dere (Vegard/Emil) må gjøre

### Før lansering
- [ ] Identifisere 3-5 pilot-klubber
- [ ] Avtale med klubbene om å teste
- [ ] Forberede e-postmaler for onboarding

### Ved onboarding av ny klubb
1. Få info: Klubbnavn, orgnr, kontaktperson (e-post + tlf)
2. Opprett klubben i admin-panelet
3. Send Stripe-lenke til klubben
4. Send Vipps-instruksjoner til klubben
5. Følg opp til begge er aktivert
6. Test at alt fungerer

### Daglig drift
- Se på dashboard: Hvor mange supportere? Hvor mye MRR?
- Følge opp klubber som ikke har fullført onboarding
- Svare på spørsmål fra klubber/supportere

---

## Penger-flyt

```
Supporter betaler beløp
        │
        ▼
┌───────────────────┐
│ Vipps / Stripe    │
└───────────────────┘
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│ Hovedbeløp        │     │ x% avgift         │
│ → Klubbens konto  │     │ → MinSponsor      │
└───────────────────┘     └───────────────────┘
```

**Merk:** Vi fastsetter snart hvor stor plattformavgiften skal være. For Stripe trekkes den automatisk. For Vipps får klubben hele beløpet, og vi fakturerer dem månedlig.

---

## Ordliste

| Begrep | Forklaring |
|--------|------------|
| **Supporter** | Person som gir penger (foreldre, besteforeldre, etc.) |
| **MRR** | Monthly Recurring Revenue - hvor mye som kommer inn hver måned |
| **Onboarding** | Prosessen med å få en klubb i gang på plattformen |
| **MSN** | Merchant Serial Number - Vipps sin ID for en bedrift |
| **Stripe** | Betalingsløsning for kort/Apple Pay |
| **Webhook** | Automatisk beskjed når noe skjer (f.eks. "betaling mottatt") |

---

## Spørsmål?

Ta kontakt med Andreas for tekniske spørsmål eller avklaringer.
