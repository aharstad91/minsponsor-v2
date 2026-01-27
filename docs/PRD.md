# MinSponsor – Product Requirements Document (PRD)

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Last Updated** | 2026-01-26 |
| **Owner** | Vegard Samdahl, Emil Holden |
| **Technical Lead** | Andreas Harstad |
| **Status** | Draft – Awaiting Technical Specifications |
| **Next Review** | After Opus planning session |

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | Andreas Harstad | Initial PRD based on brainstorm session |

### Related Documents
- `/docs/brainstorms/2026-01-26-minsponsor-mvp-brainstorm.md` – Design decisions rationale
- `/context/concept-description.md` – Original concept document
- `/context/context-stripe.md` – Stripe Connect architecture notes
- `/context/MinSponsor_Stripe_Connect_rapport (3).pdf` – Payment flow documentation

---

## 1. Executive Summary

### 1.1 Product Vision
MinSponsor is a digital platform that modernizes fundraising for Norwegian youth sports by replacing traditional product-based fundraisers (lottery sales, cake sales) with recurring monthly sponsorships from family and local networks.

### 1.2 Business Model
- **Platform Revenue:** 6% commission per transaction (total 10% including Stripe's 4% fee)
- **Payment Methods:** Vipps/MobilePay (primary), card/Apple Pay (secondary)
- **Payout Model:** Monthly settlement from Stripe to organizations

### 1.3 Market Opportunity
- **Target Market:** 600,000+ children in organized Norwegian sports
- **Problem Size:** ~50 million fundraising transactions annually worth 2,000-5,000 kr/season per family
- **Initial Focus:** Norwegian sports clubs (Phase 1), expand to Nordic markets and other categories (music, student groups) in later phases

### 1.4 MVP Success Criteria
1. 3+ clubs fully onboarded with Stripe Connect
2. 50+ successful payments (monthly + one-time)
3. Checkout time <60 seconds from page visit to payment confirmed
4. Zero manual intervention for payment processing
5. Positive qualitative feedback from pilot clubs

---

## 2. Product Overview

### 2.1 Core Value Propositions

**For Sponsors (Parents, Grandparents, Family):**
- Simple monthly support (50-200 kr/month) to children they care about
- No unwanted products to buy, store, or distribute
- Full transparency on where money goes
- Easy subscription management (pause, cancel, update)

**For Clubs:**
- Stable monthly recurring revenue (MRR)
- Minimal administrative work (no product logistics)
- Full transparency and traceability per player/team
- Modern fundraising channel that doesn't compete with existing sponsors

**For Children/Athletes:**
- More time for sports, less time selling products
- Economic security and inclusive environment
- Reduced dropout due to financial barriers

### 2.2 Key Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Support Pages** | Public-facing pages for organizations, groups, and individuals | P0 (Must Have) |
| **Frictionless Checkout** | Guest checkout with Vipps/card, no password required | P0 (Must Have) |
| **Stripe Connect Integration** | Automated payment routing to organization bank accounts | P0 (Must Have) |
| **Club Admin Dashboard** | Manage organizations/groups/individuals, view Stripe status, see MRR | P0 (Must Have) |
| **Stripe Onboarding Flow** | Hosted onboarding for clubs to connect bank accounts | P0 (Must Have) |
| **Subscription Management** | Magic link for sponsors to pause/cancel/update payments | P1 (Should Have) |
| **Transaction Tagging** | Metadata tracking (org/group/individual, campaign ref, UTM) | P1 (Should Have) |

### 2.3 Deferred Features (Post-MVP)

| Feature | Rationale for Deferral |
|---------|------------------------|
| QR Code Generation | Validate payment flow first before adding campaign tools |
| Advanced Reporting/Analytics | Use Stripe Express Dashboard in MVP, build custom later based on club feedback |
| Sponsor "My Page" Portal | Magic link management sufficient for MVP |
| Club System Integrations (Spond, MinIdrett) | Requires partnerships and complex data mapping |
| Social Features (feeds, photos) | Focus on payments first, community features later |
| Premium Tiers for Clubs | Establish product-market fit before monetization experiments |

---

## 3. User Personas & Journeys

### 3.1 Primary Personas

#### Persona 1: Kari (The Sponsor Parent)
- **Age:** 38
- **Role:** Mother of two children in sports (handball and football)
- **Tech Comfort:** Medium (uses mobile banking, social media)
- **Pain Points:** Tired of selling lottery tickets, unpredictable costs, time pressure
- **Goals:** Support her children's sports activities without logistical burden
- **Key Need:** Quick, simple checkout on mobile

#### Persona 2: Bjørn (The Club Treasurer)
- **Age:** 45
- **Role:** Treasurer for local sports club, volunteers 5-10 hours/month
- **Tech Comfort:** Low (uses Excel, email, banking)
- **Pain Points:** Unpredictable revenue, chasing families for payments, manual reconciliation
- **Goals:** Stable income, less admin work, transparency for board
- **Key Need:** Simple dashboard showing who paid what, minimal technical complexity

#### Persona 3: Berit (The Grandparent Sponsor)
- **Age:** 67
- **Role:** Grandmother, wants to support grandchildren's activities
- **Tech Comfort:** Low-Medium (uses mobile banking, email)
- **Pain Points:** Doesn't want to buy products, lives far from grandchildren
- **Goals:** Direct financial support to grandchildren, easy to set up and forget
- **Key Need:** One-time setup with minimal steps, clear confirmation

#### Persona 4: Vegard & Emil (Platform Operators)
- **Age:** 30-35
- **Role:** Co-founders of Samhold AS, operate MinSponsor platform
- **Tech Comfort:** Low (not developers, business/operations background)
- **Pain Points:** Need to onboard clubs quickly, handle support requests, generate reports
- **Goals:** Grow platform to 100+ clubs, minimize manual work, validate business model
- **Key Need:** Admin panel with clear buttons and forms, no terminal/code required

### 3.2 User Journeys

#### Journey 1: Sponsor Makes First Monthly Payment
1. Kari receives link from club (email, SMS, or social media)
2. Opens link on mobile → lands on support page for her daughter's team
3. Sees daughter's name, team info, suggested amounts (50/100/200 kr)
4. Selects 100 kr/month
5. Enters email address
6. Chooses payment method (Vipps)
7. Completes payment in Vipps app
8. Returns to confirmation page → receives receipt email
9. **Total time: <60 seconds**

#### Journey 2: Club Onboards to MinSponsor
1. Vegard contacts club treasurer (Bjørn) via email
2. Vegard creates organization in admin panel (name, org number, contact)
3. System generates Stripe Connect onboarding link
4. Vegard schedules video call with Bjørn
5. During call, Bjørn clicks link → fills out Stripe form (legal entity, bank account)
6. Stripe verifies information (may take 1-3 days)
7. Bjørn receives email from Stripe → account is live
8. Bjørn logs into Stripe Express Dashboard → sees balance $0, ready for payments
9. Vegard creates teams and players in admin panel (or Bjørn does if self-service enabled)
10. Club shares support page links with families

#### Journey 3: Sponsor Cancels Subscription
1. Berit wants to pause monthly payment (grandchild taking break from sports)
2. Opens original receipt email → clicks "Manage Subscription"
3. Lands on magic link page (no password required)
4. Sees active subscription: 100 kr/month to "Emma Hansen – Fotball G12"
5. Clicks "Pause Subscription" → confirms
6. Receives confirmation email
7. **Total time: <30 seconds**

---

## 4. Data Model & Architecture

> **Note:** This section to be completed by Opus during technical planning phase.

### 4.1 Entity Hierarchy

**Conceptual Model:**
```
Category (e.g., Sport, Music, Student Groups)
└── Organization (Legal entity, owns Stripe Connect account)
    └── Group (Optional: team, class, bus)
        └── Individual (Optional: player, student, member)
```

**Key Principles:**
- Organization is the **only entity** with a Stripe Connect account
- All payments flow to organization level
- Group and Individual are **metadata tags** for reporting and routing
- Organizations decide internally how to distribute earmarked funds

### 4.2 Core Entities

#### Entity: Category
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `name` | String | Yes | e.g., "Sport", "Music", "Russegruppe" |
| `slug` | String | Yes | URL-safe identifier |
| `description` | Text | No | For internal use |
| `created_at` | Timestamp | Yes | |
| `updated_at` | Timestamp | Yes | |

#### Entity: Organization
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `category_id` | UUID | Yes | Foreign key to Category |
| `name` | String | Yes | Official organization name |
| `org_number` | String | Yes | Norwegian org number (9 digits) |
| `slug` | String | Yes | URL-safe identifier |
| `description` | Text | No | Public-facing description |
| `logo_url` | String | No | Organization logo |
| `contact_person_name` | String | Yes | Primary contact |
| `contact_person_email` | String | Yes | Contact email |
| `contact_person_phone` | String | No | Contact phone |
| `stripe_account_id` | String | No | Stripe Connect account ID (acct_xxx) |
| `stripe_onboarding_completed` | Boolean | Yes | Default: false |
| `stripe_charges_enabled` | Boolean | Yes | Can accept payments? Default: false |
| `stripe_payouts_enabled` | Boolean | Yes | Can receive payouts? Default: false |
| `suggested_amounts` | JSON | No | Array of suggested donation amounts [50, 100, 200] |
| `status` | Enum | Yes | active, pending, suspended |
| `created_at` | Timestamp | Yes | |
| `updated_at` | Timestamp | Yes | |

#### Entity: Group
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `organization_id` | UUID | Yes | Foreign key to Organization |
| `name` | String | Yes | e.g., "G2009 Håndball", "3. klasse A" |
| `slug` | String | Yes | URL-safe identifier |
| `description` | Text | No | Public-facing description |
| `image_url` | String | No | Group photo |
| `coach_name` | String | No | Coach or leader name |
| `status` | Enum | Yes | active, inactive |
| `created_at` | Timestamp | Yes | |
| `updated_at` | Timestamp | Yes | |

#### Entity: Individual
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `organization_id` | UUID | Yes | Foreign key to Organization |
| `group_id` | UUID | No | Foreign key to Group (optional) |
| `first_name` | String | Yes | Individual's first name |
| `last_name` | String | Yes | Individual's last name |
| `slug` | String | Yes | URL-safe identifier |
| `birth_year` | Integer | No | For age grouping |
| `bio` | Text | No | Short personal description |
| `photo_url` | String | No | Individual's photo (with consent) |
| `status` | Enum | Yes | active, inactive |
| `created_at` | Timestamp | Yes | |
| `updated_at` | Timestamp | Yes | |

#### Entity: Subscription (Sponsorship)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `stripe_subscription_id` | String | No | Stripe subscription ID (for recurring) |
| `stripe_payment_intent_id` | String | No | Stripe payment intent ID (for one-time) |
| `sponsor_email` | String | Yes | Sponsor's email |
| `sponsor_name` | String | No | Optional sponsor name |
| `organization_id` | UUID | Yes | Foreign key |
| `group_id` | UUID | No | Optional target group |
| `individual_id` | UUID | No | Optional target individual |
| `amount` | Integer | Yes | Amount in øre (100 kr = 10000) |
| `currency` | String | Yes | "NOK" |
| `interval` | Enum | Yes | monthly, one_time |
| `status` | Enum | Yes | active, paused, cancelled, completed |
| `payment_method` | Enum | No | vipps, card, apple_pay |
| `campaign_ref` | String | No | Campaign reference (e.g., "qr-poster-gym") |
| `utm_source` | String | No | UTM tracking |
| `utm_medium` | String | No | UTM tracking |
| `utm_campaign` | String | No | UTM tracking |
| `started_at` | Timestamp | Yes | When subscription started |
| `paused_at` | Timestamp | No | When subscription was paused |
| `cancelled_at` | Timestamp | No | When subscription was cancelled |
| `next_payment_date` | Date | No | For recurring subscriptions |
| `created_at` | Timestamp | Yes | |
| `updated_at` | Timestamp | Yes | |

#### Entity: Transaction (Payment History)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `subscription_id` | UUID | Yes | Foreign key to Subscription |
| `stripe_charge_id` | String | Yes | Stripe charge ID |
| `organization_id` | UUID | Yes | Foreign key |
| `group_id` | UUID | No | Optional |
| `individual_id` | UUID | No | Optional |
| `amount` | Integer | Yes | Amount in øre |
| `stripe_fee` | Integer | Yes | Stripe's fee in øre |
| `platform_fee` | Integer | Yes | MinSponsor's fee in øre |
| `net_amount` | Integer | Yes | Amount to organization in øre |
| `currency` | String | Yes | "NOK" |
| `status` | Enum | Yes | succeeded, failed, refunded |
| `failure_reason` | String | No | If status = failed |
| `payment_method` | Enum | No | vipps, card, apple_pay |
| `paid_at` | Timestamp | Yes | When payment was completed |
| `created_at` | Timestamp | Yes | |

### 4.3 System Architecture

> **To be completed by Opus:** Technology stack, hosting, deployment strategy, database choice, etc.

**Placeholder sections:**
- Frontend architecture
- Backend architecture
- Database selection (PostgreSQL recommended)
- API design (REST vs GraphQL)
- Authentication/authorization approach
- Webhook handling for Stripe events
- Background job processing (for payouts, emails, etc.)
- Monitoring and logging

---

## 5. Functional Requirements

### 5.1 Public Support Pages

#### FR-01: Organization Support Page
**Priority:** P0 (Must Have)

**Requirements:**
- Public URL format: `minsponsor.no/stott/{organization-slug}`
- Display organization name, logo, description
- List all active groups within organization
- List all active individuals (if applicable)
- Show suggested donation amounts (configurable per organization)
- Display trust indicators: Stripe badge, organization number, contact info
- Call-to-action: "Støtt nå" button
- Mobile-responsive design (primary device is mobile)
- Norwegian language

**Acceptance Criteria:**
- Page loads in <2 seconds on 4G mobile connection
- All images are optimized and lazy-loaded
- Page is SEO-friendly (meta tags, Open Graph)
- Works on iOS Safari, Android Chrome, desktop browsers

#### FR-02: Group Support Page
**Priority:** P0 (Must Have)

**Requirements:**
- Public URL format: `minsponsor.no/stott/{organization-slug}/{group-slug}`
- Display group name, photo, description
- Display parent organization info (breadcrumb)
- List all active individuals in group (if applicable)
- Show suggested donation amounts
- Indicate what group funds are used for (equipment, travel, etc.)
- Call-to-action: "Støtt dette laget" button
- Breadcrumb navigation back to organization page

**Acceptance Criteria:**
- Same performance and compatibility requirements as FR-01
- Clear visual hierarchy (group info prominent, organization info secondary)

#### FR-03: Individual Support Page
**Priority:** P0 (Must Have)

**Requirements:**
- Public URL format: `minsponsor.no/stott/{organization-slug}/{group-slug}/{individual-slug}` (group optional)
- Display individual's name, photo, bio
- Display group and organization context (breadcrumbs)
- Show suggested donation amounts
- Personal message or goal (optional)
- Call-to-action: "Støtt [Name]" button
- GDPR-compliant (parent/guardian consent for minors)

**Acceptance Criteria:**
- Same performance and compatibility requirements as FR-01
- Photo display respects aspect ratios and loads efficiently

#### FR-04: Blocked Checkout for Incomplete Stripe Setup
**Priority:** P0 (Must Have)

**Requirements:**
- If organization's `stripe_charges_enabled = false`, display message:
  - "Denne klubben er ikke klar til å motta støtte ennå."
  - "Kontakt klubben for mer informasjon."
- Hide/disable "Støtt nå" button
- Provide contact email/phone for organization
- For internal admin users (Vegard/Emil), show additional context: "Stripe onboarding pending" with link to admin panel

**Acceptance Criteria:**
- Clear, friendly messaging (not technical error)
- No possibility to initiate checkout flow
- Admin users see diagnostic info (not visible to public)

### 5.2 Checkout Flow

#### FR-05: Checkout Page
**Priority:** P0 (Must Have)

**Requirements:**
- Pre-populated recipient info (organization/group/individual from URL context)
- Amount selection:
  - Radio buttons for suggested amounts (e.g., 50, 100, 200 kr)
  - Custom amount input field
- Interval selection:
  - Radio buttons: "Månedlig" (monthly) vs. "Engangsbidrag" (one-time)
- Sponsor info collection:
  - Email (required)
  - Name (optional, but encouraged)
- Payment method selection:
  - Vipps/MobilePay (primary, if available)
  - Card (Stripe Checkout fallback)
  - Apple Pay (if available)
- Display total cost breakdown:
  - Donation amount: XXX kr
  - Platform fee (10%): XX kr
  - **Total: XXX kr**
- Link to terms of service and privacy policy
- Stripe badge or security indicator
- "Støtt nå" button to confirm

**Acceptance Criteria:**
- Page loads in <1 second
- Form validation prevents invalid inputs (e.g., amount < 10 kr)
- Works on all major mobile browsers
- Keyboard-accessible and screen-reader friendly
- Total time from page visit to payment confirmed: <60 seconds

#### FR-06: Payment Processing
**Priority:** P0 (Must Have)

**Requirements:**
- Integrate with Stripe Checkout or Payment Intents API
- For Vipps/MobilePay:
  - Redirect to Vipps app (mobile) or QR code (desktop)
  - Handle return URL after payment
- For card payments:
  - Stripe-hosted checkout (3D Secure compliant)
- Create Subscription record in database with metadata:
  - `organization_id`, `group_id`, `individual_id`
  - `campaign_ref`, `utm_source`, `utm_medium`, `utm_campaign`
- Route payment to correct organization's Stripe Connect account
- Apply platform fee (application_fee_amount = 10% of donation)
- Handle payment failures gracefully:
  - Display error message
  - Allow retry without re-entering info

**Acceptance Criteria:**
- Payment success rate >95% (excluding user cancellations)
- All payments correctly tagged with metadata
- Stripe Connect account receives correct net amount
- No double-charging on retry attempts

#### FR-07: Confirmation Page
**Priority:** P0 (Must Have)

**Requirements:**
- Display success message: "Takk for støtten!"
- Show payment details:
  - Amount: XXX kr/måned (or one-time)
  - Recipient: [Name of organization/group/individual]
  - Payment method: Vipps/card
- Send confirmation email to sponsor with:
  - Receipt (amount, recipient, date)
  - "Manage Subscription" magic link (if recurring)
  - Contact info for support
- Provide social sharing option: "Del med andre" (Facebook, Twitter, WhatsApp)
- Call-to-action: "Støtt flere" (link to browse more organizations)

**Acceptance Criteria:**
- Confirmation page displays within 3 seconds of payment completion
- Email sent within 1 minute of payment
- Email includes PDF receipt attachment (optional: defer to post-MVP)
- Magic link expires after 30 days or on subscription cancellation

### 5.3 Subscription Management (Sponsor Self-Service)

#### FR-08: Magic Link Access
**Priority:** P1 (Should Have)

**Requirements:**
- Sponsor receives unique, time-limited magic link in confirmation email
- Clicking link grants access to subscription management page (no password required)
- Link format: `minsponsor.no/manage/{encrypted-token}`
- Token contains: subscription_id, sponsor_email, expiration timestamp
- Token valid for 30 days, refreshed on each visit

**Acceptance Criteria:**
- Link works on all devices (mobile, desktop)
- Expired links display friendly error message with option to request new link
- Links are single-use or rate-limited to prevent abuse

#### FR-09: Subscription Management Page
**Priority:** P1 (Should Have)

**Requirements:**
- Display current subscription details:
  - Recipient (organization/group/individual)
  - Amount and interval
  - Payment method
  - Next payment date (if recurring)
  - Total contributed to date
- Actions available:
  - **Pause subscription** (keep active but skip next payment)
  - **Resume subscription** (un-pause)
  - **Update amount** (increase/decrease monthly donation)
  - **Update payment method** (via Stripe Billing Portal)
  - **Cancel subscription** (permanent, with confirmation prompt)
- Display payment history (last 12 months)
- Download receipts (PDF, optional: defer to post-MVP)

**Acceptance Criteria:**
- Changes take effect immediately (or by next billing cycle)
- All actions update Stripe subscription correctly
- Sponsor receives confirmation email after changes
- Cancel action requires explicit confirmation ("Are you sure?")

### 5.4 Admin Dashboard (Internal Users: Vegard, Emil)

#### FR-10: Admin Authentication
**Priority:** P0 (Must Have)

**Requirements:**
- Simple username/password authentication
- Only Vegard and Emil have access initially
- Session timeout after 24 hours of inactivity
- Password reset via email

**Acceptance Criteria:**
- Secure password hashing (bcrypt or Argon2)
- No public registration page (invite-only)
- Two-factor authentication (optional: defer to post-MVP)

#### FR-11: Organization Management
**Priority:** P0 (Must Have)

**Requirements:**
- List all organizations with status indicators:
  - Name, org number, category
  - Stripe status: "Connected" (green), "Pending" (yellow), "Not Started" (red)
  - Active groups count
  - Active individuals count
  - MRR (Monthly Recurring Revenue)
- Create new organization:
  - Form fields: name, org number, category, contact person (name, email, phone)
  - Generate Stripe Connect onboarding link automatically
  - Display link for manual sharing
- Edit existing organization:
  - Update basic info (name, description, logo, contact)
  - Cannot change org number or Stripe account ID (immutable after creation)
- Delete organization (soft delete):
  - Requires confirmation
  - Only if no active subscriptions
  - Mark as "archived" instead of hard delete

**Acceptance Criteria:**
- List page loads in <3 seconds with 100+ organizations
- Search and filter by category, Stripe status
- Stripe onboarding link is copyable and shareable
- All CRUD operations log changes (audit trail)

#### FR-12: Group Management
**Priority:** P0 (Must Have)

**Requirements:**
- Nested view under each organization
- Create new group:
  - Form fields: name, description, coach name, image
- Edit existing group
- Delete group (soft delete):
  - Only if no active subscriptions
- Bulk actions:
  - Import groups from CSV (optional: defer to post-MVP)

**Acceptance Criteria:**
- Groups display in alphabetical order
- Image upload supports JPEG/PNG, max 5MB
- Slug auto-generated from name (URL-safe)

#### FR-13: Individual Management
**Priority:** P0 (Must Have)

**Requirements:**
- Nested view under each group (or organization if no group)
- Create new individual:
  - Form fields: first name, last name, birth year, bio, photo
  - GDPR consent checkbox: "Consent received from parent/guardian"
- Edit existing individual
- Delete individual (soft delete):
  - Only if no active subscriptions
- Bulk actions:
  - Import individuals from CSV (optional: defer to post-MVP)

**Acceptance Criteria:**
- Photo upload supports JPEG/PNG, max 2MB
- Bio limited to 500 characters
- Minors (<18) require explicit consent flag

#### FR-14: Dashboard Overview
**Priority:** P1 (Should Have)

**Requirements:**
- Key metrics (platform-wide):
  - Total active organizations
  - Total active subscriptions
  - Total MRR (Monthly Recurring Revenue)
  - Total one-time donations this month
  - Churn rate (cancelled subscriptions / total subscriptions)
- Recent activity feed:
  - New organizations onboarded
  - New subscriptions created
  - Cancelled subscriptions
  - Failed payments (dunning alerts)
- Quick actions:
  - Create new organization
  - View pending Stripe onboardings

**Acceptance Criteria:**
- Dashboard loads in <2 seconds
- Metrics update in real-time (or <5 min delay)
- Activity feed shows last 50 events

#### FR-15: Organization Detail View
**Priority:** P1 (Should Have)

**Requirements:**
- For each organization, display:
  - Stripe Connect status (detailed):
    - Charges enabled: Yes/No
    - Payouts enabled: Yes/No
    - Balance: XXX kr (if accessible via Stripe API)
    - Last payout date and amount
  - MRR breakdown:
    - Total MRR
    - Active subscriptions count
    - Average donation amount
  - Recent transactions (last 10)
  - All groups and individuals with their MRR
- Actions:
  - "Re-send Stripe onboarding link" (if incomplete)
  - "View in Stripe Dashboard" (direct link to Stripe Connect account)

**Acceptance Criteria:**
- Stripe API calls cached to avoid rate limits
- Balance data refreshed every 5 minutes
- Links to Stripe Dashboard open in new tab

### 5.5 Stripe Connect Integration

#### FR-16: Stripe Connect Account Creation
**Priority:** P0 (Must Have)

**Requirements:**
- When admin creates new organization, automatically:
  - Call Stripe API: `POST /v1/accounts`
  - Type: `express`
  - Country: `NO`
  - Capabilities: `card_payments`, `transfers`
  - Store returned `account_id` in Organization record
- Generate Stripe Connect onboarding link:
  - Call Stripe API: `POST /v1/account_links`
  - Type: `account_onboarding`
  - Return URL: `minsponsor.no/admin/organizations/{id}/stripe-callback`
  - Refresh URL: `minsponsor.no/admin/organizations/{id}/stripe-refresh`
- Store onboarding link for manual sharing

**Acceptance Criteria:**
- Account creation completes in <3 seconds
- Error handling if Stripe API fails (retry logic)
- Onboarding link valid for 24 hours (regenerate if expired)

#### FR-17: Stripe Connect Webhook Handling
**Priority:** P0 (Must Have)

**Requirements:**
- Listen for Stripe webhook events:
  - `account.updated` → Update organization's Stripe status
  - `charge.succeeded` → Create Transaction record
  - `charge.failed` → Log failure, trigger dunning email
  - `customer.subscription.updated` → Update Subscription status
  - `customer.subscription.deleted` → Mark subscription as cancelled
- Verify webhook signature (security)
- Idempotent handling (prevent duplicate processing)
- Retry logic for failed webhook processing

**Acceptance Criteria:**
- Webhooks processed within 5 seconds
- All events logged for debugging
- Failed webhooks retried 3 times with exponential backoff

#### FR-18: Platform Fee Calculation
**Priority:** P0 (Must Have)

**Requirements:**
- For every payment, calculate:
  - Donation amount (user-selected)
  - Platform fee = 10% of donation amount
  - Total charge = donation amount + platform fee
  - Stripe fee = 4% of total charge (handled by Stripe)
  - Net to organization = donation amount - Stripe fee
- Apply platform fee using Stripe's `application_fee_amount` parameter
- Example:
  - User selects: 100 kr
  - Platform fee: 10 kr
  - Total charged: 110 kr
  - Stripe fee: ~4.40 kr (4% of 110)
  - Net to org: ~105.60 kr (110 - 4.40)
  - Net to MinSponsor: ~5.60 kr (10 - 4.40)

**Acceptance Criteria:**
- Fee calculation is accurate to øre (no rounding errors)
- Fees displayed transparently during checkout
- Transaction records include all fee breakdowns

---

## 6. Technical Requirements

> **To be completed by Opus during technical planning phase.**

### 6.1 Technology Stack (TBD)

**Frontend:**
- Framework: [Next.js / SvelteKit / Remix / Other?]
- UI Library: [Tailwind CSS / Shadcn UI / Other?]
- State Management: [Context API / Zustand / Redux / Other?]

**Backend:**
- Framework: [Node.js + Express / Ruby on Rails / Go + Gin / Other?]
- Language: [TypeScript / Ruby / Go / Other?]
- API Style: [REST / GraphQL?]

**Database:**
- Primary: [PostgreSQL / MySQL / Other?]
- ORM: [Prisma / Drizzle / ActiveRecord / Other?]

**Hosting:**
- Frontend: [Vercel / Netlify / Cloudflare Pages?]
- Backend: [Railway / Render / Heroku / Fly.io?]
- Database: [Neon / Supabase / Railway / RDS?]

### 6.2 Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time | <2s on 4G mobile | Lighthouse, Core Web Vitals |
| Checkout Completion Time | <60s (user-controlled) | Analytics, user testing |
| API Response Time | <500ms (p95) | APM monitoring |
| Database Query Time | <100ms (p95) | Database monitoring |
| Uptime | 99.9% (8.76 hours downtime/year) | Uptime monitoring |

### 6.3 Scalability Requirements

**MVP Phase (0-12 months):**
- Support 100 organizations
- Handle 10,000 subscriptions
- Process 50,000 transactions/month
- Database size: <10 GB

**Growth Phase (12-24 months):**
- Support 500 organizations
- Handle 50,000 subscriptions
- Process 250,000 transactions/month
- Database size: <50 GB

**Infrastructure Decisions:**
- Horizontal scaling strategy (TBD by Opus)
- Caching layer (Redis? In-memory?)
- CDN for static assets
- Background job processing (for emails, webhooks, reports)

### 6.4 Browser & Device Support

**Required Support:**
- iOS Safari (last 2 versions)
- Android Chrome (last 2 versions)
- Desktop Chrome (last 2 versions)
- Desktop Safari (last 2 versions)
- Desktop Firefox (last 2 versions)

**Progressive Enhancement:**
- Core functionality works without JavaScript (forms, links)
- Enhanced experience with JavaScript (dynamic updates, validation)

### 6.5 Internationalization (i18n)

**MVP:** Norwegian (Bokmål) only

**Post-MVP:** Swedish, Danish, Finnish

**Technical Requirements:**
- All user-facing strings externalized (no hardcoded text)
- Currency formatting (kr, NOK symbol)
- Date/time formatting (Norwegian conventions)
- Number formatting (space as thousands separator: "1 000 kr")

---

## 7. Integration Requirements

### 7.1 Stripe Integration

#### Stripe APIs Used
- **Stripe Connect API:** Account creation, onboarding, account retrieval
- **Payment Intents API:** One-time payments
- **Subscriptions API:** Recurring payments
- **Webhooks API:** Real-time event notifications
- **Billing Portal API:** Sponsor subscription management (optional)

#### Stripe Products/Services
- **Stripe Connect Express:** For organization accounts
- **Stripe Checkout:** For card payments (optional, depending on implementation)
- **Vipps via Stripe:** If available (TBD: check Stripe Vipps integration status)

#### Stripe Webhook Events (Minimum)
- `account.updated`
- `charge.succeeded`
- `charge.failed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 7.2 Vipps/MobilePay Integration

**Status:** TBD by Opus (Does Stripe natively support Vipps Recurring in Norway?)

**If Stripe supports Vipps:**
- Use Stripe Payment Methods API
- No separate integration required

**If separate integration required:**
- Use Vipps Recurring API
- Handle OAuth flow for Vipps authentication
- Map Vipps transactions to Stripe Connect accounts (complex)

**Decision Point:** Investigate during Opus planning phase.

### 7.3 Email Service

**Requirements:**
- Transactional emails:
  - Sponsor confirmation receipts
  - Subscription management magic links
  - Failed payment notifications (dunning)
  - Admin notifications (new signups, failed webhooks)
- Email templates (HTML + plain text)
- Tracking: open rates, click rates

**Provider Options (TBD by Opus):**
- Resend (developer-friendly, modern)
- Postmark (transactional focus)
- SendGrid (established, feature-rich)
- AWS SES (cost-effective, requires setup)

### 7.4 File Storage (Images)

**Requirements:**
- Store organization logos, group photos, individual photos
- Serve via CDN for performance
- Max file size: 5 MB per image
- Supported formats: JPEG, PNG, WebP

**Provider Options (TBD by Opus):**
- Cloudflare R2 (S3-compatible, zero egress fees)
- AWS S3 + CloudFront
- Vercel Blob Storage (if using Vercel)
- Supabase Storage (if using Supabase)

### 7.5 Analytics & Monitoring

**Requirements:**
- Privacy-friendly analytics (GDPR-compliant)
- Track key events:
  - Page views (support pages)
  - Checkout initiated
  - Checkout completed
  - Checkout abandoned (at which step?)
  - Subscription cancelled
- Error tracking (frontend + backend)
- Performance monitoring (API latency, page load times)

**Provider Options (TBD by Opus):**
- Plausible Analytics (privacy-focused, Norwegian-friendly)
- Simple Analytics (privacy-focused)
- Sentry (error tracking)
- Vercel Analytics (if using Vercel)

---

## 8. Non-Functional Requirements

### 8.1 Security

#### Authentication
- Admin users: bcrypt/Argon2 password hashing
- Sponsors: Magic link authentication (JWT-based or similar)
- API: API keys for webhook verification (Stripe signature)

#### Data Protection
- HTTPS only (no HTTP traffic)
- Environment variables for secrets (never hardcoded)
- Database credentials encrypted at rest
- PII (Personally Identifiable Information) handling:
  - Sponsor email addresses (encrypted)
  - Children's photos (consent-based, deletable)

#### Compliance
- GDPR-compliant data handling:
  - Right to erasure (delete account and all data)
  - Right to access (export user data)
  - Consent for marketing emails (opt-in only)
- PSD2 compliant (handled by Stripe)

### 8.2 Reliability

**Error Handling:**
- All API calls have timeout limits (5s for Stripe, 10s for others)
- Retry logic for transient failures (exponential backoff)
- Graceful degradation (if Stripe API is down, show maintenance message)

**Data Integrity:**
- Database transactions for multi-step operations
- Idempotency keys for Stripe API calls (prevent duplicate charges)
- Audit logs for all admin actions

**Backup & Recovery:**
- Daily automated database backups
- 30-day retention period
- Tested restore procedure (quarterly drills)

### 8.3 Maintainability

**Code Quality:**
- Linting (ESLint for JS/TS, Rubocop for Ruby, etc.)
- Code formatting (Prettier, auto-formatted on save)
- Type safety (TypeScript preferred if Node.js)
- Unit tests (minimum 70% coverage for critical paths)
- Integration tests (Stripe webhooks, payment flows)

**Documentation:**
- README with setup instructions
- Architecture decision records (ADRs) for major choices
- API documentation (Swagger/OpenAPI or similar)
- Inline code comments for complex logic

**Deployment:**
- CI/CD pipeline (GitHub Actions or similar)
- Staging environment (mirror of production)
- Feature flags for gradual rollout (optional, post-MVP)

---

## 9. User Experience Requirements

### 9.1 Design Principles

**Visual Identity:**
- Warm, minimalist Scandinavian design
- Inspiration: hjem.no (Nordic, clean, trust-building)
- Color palette: Warm, inviting colors (not clinical white/gray)
- Typography: Readable, friendly, modern (e.g., Inter, Source Sans Pro)
- Imagery: Authentic sports photos, children in action, community feeling

**Tone of Voice:**
- Friendly and practical (not corporate)
- Direct and honest (transparent about money)
- Inclusive (all children should feel welcome)
- Inspiring (focus on what sports give children)

**Messaging Examples:**
- ✅ "Gi barna mer tid til det de elsker" (Give children more time for what they love)
- ✅ "Støtt drømmen, ikke dugnaden" (Support the dream, not the fundraiser)
- ❌ "Optimaliser inntektsstrømmer for din organisasjon" (Too corporate)

### 9.2 Accessibility (WCAG 2.1 Level AA)

**Requirements:**
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All interactive elements accessible via Tab/Enter
- Screen reader support: ARIA labels, semantic HTML
- Focus indicators: Visible focus state for all interactive elements
- Alt text for all images
- No reliance on color alone to convey information

### 9.3 Mobile-First Design

**Priority:** Mobile experience is primary (70% of users expected on mobile)

**Requirements:**
- Touch targets: Minimum 44x44px (Apple HIG guideline)
- Thumb-friendly navigation (bottom nav if applicable)
- Minimal text entry (pre-fill, dropdowns, suggestions)
- Fast loading on 4G (images optimized, lazy loading)
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

---

## 10. Admin Requirements

### 10.1 User Roles

**MVP Roles:**
- **Super Admin** (Vegard, Emil): Full access to all features
- **Read-Only** (Future: accountant, board members): View-only access to reports

**Post-MVP Roles:**
- **Club Admin:** Manage own organization's groups/individuals (not other clubs)
- **Support Agent:** Handle sponsor inquiries, resend magic links

### 10.2 Admin Workflows

#### Workflow: Onboard New Club
1. Admin receives inquiry from club (email, phone, meeting)
2. Admin logs into MinSponsor admin panel
3. Admin navigates to "Organizations" → "Create New"
4. Admin fills form: name, org number, category, contact person
5. Admin clicks "Create & Generate Stripe Link"
6. System creates organization and Stripe Connect account
7. System displays onboarding link (copyable)
8. Admin sends link to club contact via email
9. Admin schedules follow-up call to assist with Stripe onboarding
10. Club completes Stripe form (juridic info, bank account)
11. Stripe verifies information (1-3 days)
12. Admin receives notification: "Heimdal IL is now live!"
13. Admin creates groups (teams) and individuals (players) for club
14. Admin generates support page URLs and shares with club

#### Workflow: Handle Failed Payment
1. Stripe webhook: `invoice.payment_failed`
2. System creates admin notification
3. Admin sees notification in dashboard: "Payment failed for 100 kr to Vidar Samdahl"
4. Admin clicks notification → views subscription details
5. System shows: sponsor email, last successful payment, failure reason
6. Admin clicks "Send Dunning Email"
7. System sends automated email to sponsor: "Payment failed, please update payment method"
8. Sponsor clicks magic link → updates card → payment retries automatically

---

## 11. Security & Compliance

### 11.1 GDPR Compliance

**Data Minimization:**
- Collect only necessary data (email, name optional, no phone numbers required)
- Children's data: photo and bio are optional, require explicit consent

**Right to Erasure:**
- Sponsors can request account deletion via email
- System deletes: email, name, payment history (retain only anonymized transaction records for accounting)
- Stripe subscription cancelled automatically

**Right to Access:**
- Sponsors can request data export via email
- System generates JSON file with all sponsor data

**Consent Management:**
- Marketing emails: Opt-in checkbox during signup (unchecked by default)
- Children's photos: Admin must check "Consent received" before publishing

### 11.2 Payment Security

**PCI DSS Compliance:**
- Stripe handles all card data (MinSponsor never stores card numbers)
- No PCI DSS certification required (Stripe is certified)

**Fraud Prevention:**
- Stripe Radar (automatic fraud detection)
- Rate limiting on checkout (max 5 attempts per hour per IP)
- Email verification for large donations (>1000 kr, optional)

### 11.3 Data Retention

**Active Data:**
- Organization data: Retained while organization is active
- Subscription data: Retained while subscription is active
- Transaction data: Retained for 7 years (Norwegian accounting law)

**Deleted Data:**
- Soft delete organizations/groups/individuals (mark as deleted, don't purge)
- Hard delete sponsor PII on request (anonymize transaction records)

---

## 12. Success Metrics

### 12.1 Launch Metrics (MVP Validation)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Clubs Onboarded | 3+ | Admin dashboard |
| Successful Payments | 50+ | Transaction count |
| Checkout Completion Rate | >50% | Analytics (completed / initiated) |
| Average Donation Amount | 100-150 kr | Transaction data |
| Checkout Time | <60s (p90) | Analytics |
| Stripe Onboarding Completion Time | <10 min (p90) | Manual tracking (pilot phase) |

### 12.2 Growth Metrics (Month 1-6)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active Clubs | 20+ by Month 6 | Admin dashboard |
| Active Subscriptions | 500+ by Month 6 | Subscription count |
| MRR | 50,000 kr by Month 6 | Subscription data |
| Churn Rate | <5% per month | (Cancelled / Total) subscriptions |
| Payment Success Rate | >95% | (Succeeded / Total) payments |
| Club Satisfaction | >8/10 NPS | Quarterly survey |

### 12.3 Financial Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Platform Revenue | Total platform fees collected | 5,000 kr/month by Month 6 (10% of 50k MRR) |
| Customer Acquisition Cost (CAC) | Sales & marketing spend / new clubs | <5,000 kr per club |
| Lifetime Value (LTV) | Avg MRR per club × avg club lifetime | >50,000 kr per club (assuming 24-month retention) |
| LTV:CAC Ratio | LTV / CAC | >3:1 |

---

## 13. Release Plan

### 13.1 MVP Scope (Version 1.0)

**Timeline:** 6-8 weeks (TBD by Opus)

**Included Features:**
- FR-01 to FR-07: Public support pages + checkout flow
- FR-08 to FR-09: Sponsor subscription management (magic link)
- FR-10 to FR-15: Admin dashboard (organization/group/individual CRUD)
- FR-16 to FR-18: Stripe Connect integration
- Basic email notifications (confirmation, dunning)

**Success Criteria:**
- 3+ clubs onboarded and live
- 50+ successful payments
- Checkout time <60s
- Zero critical bugs in production

### 13.2 Post-MVP Roadmap (Version 1.x)

**Version 1.1 (Month 2-3):**
- QR code generation and campaign tracking
- Enhanced reporting (CSV export, advanced filters)
- Bulk import for groups/individuals

**Version 1.2 (Month 4-6):**
- Sponsor "My Page" portal (enhanced self-service)
- Email marketing campaigns (announce new teams, milestones)
- Club self-service registration (reduce Vegard/Emil workload)

**Version 2.0 (Month 6-12):**
- Nordic expansion (Sweden, Denmark, Finland)
- Multi-language support (Swedish, Danish, Finnish)
- Integration with Spond, MinIdrett (club management systems)
- Premium features for clubs (advanced analytics, white-label pages)

### 13.3 Pilot Phase Plan

**Pre-Launch (Week 1-2):**
- Identify 3-5 friendly clubs (Vegard's network)
- Schedule onboarding calls
- Prepare demo accounts and test data

**Pilot Launch (Week 3-4):**
- Onboard clubs via white-glove process (video calls)
- Create groups and individuals for each club
- Generate support page URLs and share with families
- Monitor first 50 payments closely (manual checks)

**Feedback Collection (Week 5-6):**
- Interview club treasurers (what worked, what didn't)
- Survey sponsors (checkout experience, trust level)
- Analyze drop-off points (where did users abandon checkout?)
- Identify feature gaps (what did clubs ask for?)

**Refinement (Week 7-8):**
- Fix critical bugs and UX issues
- Improve onboarding flow based on feedback
- Enhance admin dashboard based on Vegard/Emil requests
- Prepare for public launch

---

## 14. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Stripe onboarding delays (KYC/AML issues) | High | High | White-glove support during pilot, pre-validate documents, prepare troubleshooting guide |
| Low payment conversion (<50% checkout completion) | Medium | High | A/B test checkout flow, simplify steps, add trust indicators (Stripe badge, club logos) |
| Vipps integration not available via Stripe | Medium | Medium | Research Vipps API, have fallback plan (card-only MVP), consider separate Vipps integration |
| Club distrust of new platform | Medium | Medium | Leverage Vegard's network, testimonials from pilot clubs, transparent pricing and terms |
| High churn rate (>10% per month) | Low | High | Engage clubs monthly, celebrate milestones, reduce friction in sponsor management |
| Regulatory issues (money transmission laws) | Low | Critical | Legal review before launch, ensure Stripe handles compliance, consult with accountant |
| Technical complexity underestimated | High | Medium | Use Opus for realistic planning, prioritize ruthlessly, defer non-critical features |

---

## 15. Open Questions

> **To be resolved during Opus planning phase or stakeholder discussion.**

### 15.1 Technical Questions
1. **Technology stack:** What framework/language minimizes development time while remaining maintainable?
2. **Vipps integration:** Does Stripe natively support Vipps Recurring in Norway, or do we need separate integration?
3. **Subscription management:** Should we use Stripe Billing Portal or build custom UI for sponsor subscription management?
4. **Database choice:** PostgreSQL (relational) vs. MongoDB (document) vs. other?
5. **Hosting:** Vercel + Railway? Render? Heroku? All-in-one (e.g., Supabase)?
6. **Background jobs:** How to handle async tasks (webhook processing, email sending, payout calculations)?

### 15.2 Business Questions
1. **Pricing model:** Is 10% platform fee (6% to MinSponsor, 4% to Stripe) sustainable? Should we test different fee structures?
2. **Pilot clubs:** Which 3-5 clubs should we approach first? (Vegard to identify)
3. **Marketing:** How do we acquire clubs beyond Vegard's network? (Digital ads, partnerships, referrals?)
4. **Legal structure:** Does Samhold AS need any licenses or registrations to operate this platform?
5. **Accounting:** How do we handle VAT on platform fees? (Consult accountant)

### 15.3 Product Questions
1. **QR code priority:** Should QR codes be in MVP or defer to v1.1? (Depends on club acquisition strategy)
2. **Sponsor profiles:** Should sponsors have optional profiles with photo and bio (to build community)?
3. **Social features:** Do clubs want to post updates, photos, or achievements? (Defer to post-MVP unless critical)
4. **Gamification:** Should we add leaderboards, milestones, or badges to encourage donations? (Defer to post-MVP)

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| **MRR** | Monthly Recurring Revenue – total of all monthly subscriptions |
| **Churn** | Rate at which subscribers cancel (monthly churn = cancellations / total subscriptions) |
| **Dunning** | Process of retrying failed payments and notifying sponsors |
| **Magic Link** | Passwordless authentication via time-limited URL sent to email |
| **Stripe Connect** | Stripe's platform for marketplace and multi-party payments |
| **Express Account** | Simplified Stripe account type for sellers (used by organizations) |
| **Platform Fee** | Fee charged by MinSponsor per transaction (6% in this model) |
| **Application Fee** | Stripe's term for platform fee in Connect architecture |

### 16.2 Reference Links

**Stripe Documentation:**
- Stripe Connect Guide: https://stripe.com/docs/connect
- Express Accounts: https://stripe.com/docs/connect/express-accounts
- Account Onboarding: https://stripe.com/docs/connect/onboarding
- Webhooks: https://stripe.com/docs/webhooks
- Payment Intents: https://stripe.com/docs/payments/payment-intents

**Design Inspiration:**
- hjem.no (Scandinavian design)
- Vipps checkout flow (Norwegian UX)
- Stripe Checkout (payment trust)

**Competitor Research:**
- GoFundMe Teams (US)
- Hometeam (US youth sports funding)
- TeamSnap (club management + payments)

### 16.3 Contact Information

| Role | Name | Email |
|------|------|-------|
| Product Owner | Vegard Samdahl | vegard@samhold.no (placeholder) |
| Operations | Emil Holden | emil@samhold.no (placeholder) |
| Developer/Designer | Andreas Harstad | andreas@samhold.no (placeholder) |
| Accountant | Hilde Sørø | hilde@samhold.no (placeholder) |

---

**End of PRD v1.0**

**Next Steps:**
1. Opus to complete technical architecture (Section 4 & 6)
2. Resolve open questions (Section 15)
3. Create detailed implementation plan with task breakdown
4. Estimate timeline and resource requirements
5. Review and approve PRD with stakeholders (Vegard, Emil)
6. Begin development

---

*This PRD is a living document. All changes must be documented in the Version History table.*
