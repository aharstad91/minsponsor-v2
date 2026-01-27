# MinSponsor MVP – Brainstorm & Design Decisions
**Date:** 2026-01-26
**Status:** Ready for planning
**Next step:** Opus implementation planning in separate session

---

## What We're Building

### The Core Problem
Norwegian youth sports rely on outdated fundraising (lottery sales, cake sales, toilet paper sales) that creates:
- **For parents:** Time pressure, unpredictable costs, logistics burden, stress from 5-6 simultaneous fundraisers
- **For children:** Economic barriers, dropout when costs become too heavy, focus on sales rather than sports
- **For clubs:** Unpredictable income, administrative overhead, recruitment challenges

### The Solution
MinSponsor replaces product-based fundraising with **modern recurring sponsorship** from family and local networks.

**Key value proposition:**
- **For sponsors:** Simple monthly support (50-200 kr/month) to children they care about, instead of buying unwanted products
- **For clubs:** Stable monthly recurring revenue (MRR), minimal admin, full transparency
- **For children:** More time for sports, economic security, inclusive environment

### Business Model
- **Platform fee:** 6% of each transaction (total 10% including Stripe's 4%)
- **Payment methods:** Vipps/MobilePay (primary), card/Apple Pay via Stripe
- **Payout model:** Monthly settlement from Stripe to clubs

---

## Why This Approach

### Primary User Journey: Club-Driven Onboarding
**Decision:** Clubs are the driver, not individual parents.

**Rationale:**
- Clubs have existing relationships and trust with families
- One club onboards many families = efficient scaling
- Clubs control their own Stripe Connect account = clean payment flows
- Parents/grandparents become sponsors through club-initiated campaigns

### Data Hierarchy: Generic & Flexible
**Decision:** Use generic entity model, not sports-specific:

```
Category (Sport, Music, Student groups, etc.)
└── Organization (Legal entity, owns Stripe account)
    └── Group (Optional: team/class/bus)
        └── Individual (Optional: player/student/member)
```

**Rationale:**
- Enables expansion beyond sports (music, student groups, Russ groups)
- Organization = legal entity that receives money
- Group & Individual = tagging for reporting, not separate bank accounts
- Simple model = less complexity in MVP

### Technology Philosophy: Admin-First, Non-Technical Users
**Decision:** Build for Vegard & Emil (non-technical founders) as primary operators.

**Rationale:**
- They need clear admin panel with buttons and guides, not terminal commands
- Stripe handles complex payment flows = less custom code
- Simple CRUD operations for organizations/groups/individuals
- Focus on UX for club admins and sponsors, not internal tooling sophistication

### Payment Architecture: Stripe Connect Express per Organization
**Decision:** One Stripe Connect Express account per organization (club).

**Key constraints:**
- Organization completes KYC/AML onboarding via Stripe-hosted forms
- Organization gets Stripe Express Dashboard (not MinSponsor login) for financial visibility
- Money flows: Sponsor → Stripe → Organization's bank account
- MinSponsor never touches the money directly (regulatory simplicity)

**Rationale:**
- Stripe handles compliance, fraud, payouts = minimal regulatory risk
- Express Dashboard gives clubs financial transparency without custom builds
- Connected accounts scale naturally (each org = independent financial entity)

---

## Key Decisions

### 1. MVP Scope – Ruthlessly Simple

**IN SCOPE:**
- ✅ Public support pages (organization/group/individual)
- ✅ Frictionless checkout (guest checkout, email-only, no password)
- ✅ Vipps/MobilePay + card/Apple Pay payment methods
- ✅ Club admin dashboard showing:
  - All groups and individuals
  - Stripe connection status
  - Accumulated funds (MRR visibility)
  - Basic management (create/edit/delete entities)

**OUT OF SCOPE (post-MVP):**
- ❌ QR code generation (defer until we validate payment flow)
- ❌ Advanced reporting/analytics
- ❌ Sponsor "My Page" (link-based management only)
- ❌ Integrations with club systems (Spond, MinIdrett)
- ❌ Social features (feeds, updates, photos)

**Critical success factor:** Sponsor can pay in under 60 seconds from discovering a support page to payment confirmed.

### 2. Stripe-First, Custom-Last

**Decision:** Leverage Stripe's built-in features maximally.

**What Stripe handles:**
- Payment processing (Vipps, cards, Apple Pay)
- Connected account onboarding (hosted forms)
- KYC/AML compliance
- Express Dashboard for clubs (viewing payouts, updating bank info)
- Automated payouts (weekly/monthly)
- Subscription management (recurring charges)

**What MinSponsor handles:**
- Public-facing support pages
- Checkout flow with entity selection
- Admin panel for Vegard/Emil to manage organizations
- Tagging transactions with metadata (organization_id, group_id, individual_id, campaign_ref)
- Basic reporting (who supports what)

**Trade-off accepted:** Clubs use Stripe Express Dashboard for financial data, not a custom MinSponsor dashboard. This defers complexity but requires clubs to use two systems (Stripe for money, MinSponsor for profiles).

### 3. Checkout: Passwordless & Frictionless

**Decision:** Sponsors pay as guests. No account creation required.

**Flow:**
1. Sponsor visits support page (e.g., minsponsor.no/stott/heimdal-handball/g2009/vidar-samdahl)
2. Selects amount (50/100/200 kr suggestions + custom)
3. Chooses monthly or one-time
4. Enters email
5. Pays via Vipps/card
6. Receives receipt with link to "Manage Subscription" (magic link, no password)

**Rationale:**
- Lower friction = higher conversion
- Magic link = modern UX (Stripe supports this natively)
- Sponsor doesn't need to "learn a new platform"

### 4. Club Onboarding: White-Glove in Pilot

**Decision:** Vegard/Emil manually onboard clubs via admin panel.

**Process:**
1. Vegard/Emil create organization in admin panel (name, org number, contact person)
2. System generates Stripe Connect onboarding link
3. They send link to club contact (treasurer/leader)
4. Club completes Stripe-hosted onboarding (juridic info + bank account)
5. Stripe automatically connects account to MinSponsor
6. Club is "live" and can receive payments

**Pilot approach:** Sit with clubs via video call during onboarding to learn friction points.

**Post-pilot:** Potentially allow self-service registration, but not required for MVP.

### 5. Money Routing: Organization Gets Everything

**Decision:** All payments go to organization level, not split automatically.

**Hierarchy implications:**
- Sponsor can choose to support:
  - **Organization** (general club support)
  - **Group** (e.g., "G2009 team")
  - **Individual** (e.g., "Vidar Samdahl")
- But money **always flows to organization's Stripe account**
- Group and Individual are metadata tags for reporting
- Organization decides internally how to distribute funds

**Rationale:**
- One bank account per legal entity = simple compliance
- No automatic splitting = less complex code
- Club retains control over fund distribution
- Still provides transparency (reports show what was earmarked for each group/individual)

**Trade-off accepted:** Requires trust between sponsors and clubs. Clubs must manually distribute earmarked funds.

### 6. Stripe Connection Required Before Checkout

**Decision:** Block checkout if organization hasn't completed Stripe onboarding.

**UX:**
- Support page shows message: "This club is not ready to receive support yet. Contact the club."
- Clear call-to-action for club to complete setup
- No escrow, no "pending payments" = zero regulatory complexity

**Rationale:**
- Simpler than holding funds in escrow
- Clear incentive for clubs to complete onboarding
- Avoids confusing sponsors with failed/delayed transactions

---

## Technical Constraints & Requirements

### Must-Haves (Non-Negotiable)
1. **Mobile-first design** – Majority of sponsors will use mobile (especially via QR codes in future)
2. **Stripe Connect Express integration** – Core payment architecture
3. **Non-technical admin UI** – Vegard/Emil need simple forms, not code
4. **Norwegian language** – Primary market is Norway
5. **Fast checkout** – Under 60 seconds from page visit to payment confirmed

### Nice-to-Haves (Defer if Time-Constrained)
- QR code generation with UTM tracking
- CSV export of transactions
- Automated email campaigns
- Integration with club management systems

### Technology Selection (To Be Decided in Planning Phase)
**Not decided yet:**
- Frontend framework (Next.js? SvelteKit? Plain HTML/Tailwind?)
- Backend framework (Node.js? Rails? Go?)
- Database (PostgreSQL? MySQL?)
- Hosting (Vercel? Railway? Heroku?)

**Constraints for tech selection:**
- Must support Stripe Connect webhooks
- Must be deployable by non-DevOps team (simple hosting)
- Must support i18n (Norwegian now, Swedish/Danish later)
- Must be fast to develop (MVP target: 4-6 weeks)

---

## Open Questions & Risks

### Open Questions (For Planning Phase)
1. **Technology stack:** What framework/language minimizes development time while remaining maintainable?
2. **Vipps/MobilePay integration:** Does Stripe natively support Vipps Recurring, or do we need separate integration?
3. **Subscription management:** How do sponsors pause/cancel/update subscriptions via magic link?
4. **Failed payment handling:** How do we notify sponsors when recurring payment fails (dunning)?
5. **Reporting granularity:** What level of transaction detail do clubs need to see in MVP?

### Known Risks
1. **Stripe compliance delays:** KYC/AML can take days/weeks if documents are unclear
   - **Mitigation:** White-glove onboarding in pilot, pre-validate documents
2. **Payment method coverage:** Vipps/MobilePay may not cover all Norwegian demographics
   - **Mitigation:** Also support card/Apple Pay as fallback
3. **Trust barrier:** Sponsors may not trust a new platform with recurring payments
   - **Mitigation:** Clear branding, Stripe badge, testimonials from pilot clubs
4. **Internal fund distribution:** Clubs may not honor earmarked donations (group/individual tags)
   - **Mitigation:** Transparency reports, clear terms, social pressure from families

---

## Success Metrics (MVP)

### Launch Criteria (What defines "MVP done")
1. ✅ 3+ clubs fully onboarded with Stripe Connect
2. ✅ 50+ successful payments (mix of monthly + one-time)
3. ✅ Sponsor can checkout in <60 seconds
4. ✅ No manual intervention required for payment processing
5. ✅ Clubs can view MRR and active sponsors in dashboard

### Post-Launch Metrics (Month 1-3)
- **Payment conversion rate:** % of support page visitors who complete checkout (target: >10%)
- **Churn rate:** % of monthly sponsors who cancel (target: <5% per month)
- **Average donation:** Mean monthly sponsorship amount (expect 100-150 kr)
- **Club satisfaction:** Qualitative feedback from pilot clubs (time saved, revenue predictability)

---

## Next Steps

### Immediate Actions
1. **Opus planning session** (separate):
   - Select technology stack
   - Define data models (schema)
   - Plan Stripe Connect integration approach
   - Break down into implementable tasks
   - Estimate MVP timeline

2. **Design explorations:**
   - Sketch support page layouts
   - Design checkout flow mockups
   - Plan admin panel structure

3. **Legal/compliance review:**
   - Confirm platform fee structure with accountant
   - Review Stripe's terms for Norwegian market
   - Draft sponsor/club terms of service

### Pilot Phase Preparation
- Identify 3-5 friendly clubs willing to test
- Schedule onboarding sessions
- Prepare feedback collection template
- Set up analytics (Plausible/Simple Analytics for privacy)

---

## Appendix: Inspiration & Comparable Services

### Similar Models (International)
- **GoFundMe Teams:** Fundraising for sports teams, but focused on one-time campaigns
- **TeamSnap:** Club management + payment collection, but expensive and complex
- **Hometeam (US):** Youth sports funding platform, closest comparable

### Design Inspiration
- **hjem.no:** Scandinavian minimalist, warm colors, trustworthy
- **Vipps checkout:** Fast, mobile-first, Norwegian UX patterns
- **Stripe Checkout:** Clean, professional, secure feeling

### Key Differentiators
- **Norwegian-first:** Built for Norwegian market (Vipps, org numbers, language)
- **Zero admin overhead:** Clubs don't manage subscriptions, Stripe does
- **MRR-focused:** Recurring revenue model vs. one-time fundraisers
- **Multi-category:** Not limited to sports (expandable to music, students, etc.)

---

**Brainstorm complete.** Ready for Opus to create detailed implementation plan.
