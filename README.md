This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development

### Setup Admin User

Create the admin user for local development:

```bash
npm run create-admin
```

This creates an admin user with credentials from `.env.local`:
- Email: `admin@minsponsor.no`
- Password: `minsponsor123`

### Seed Test Data

Populate the admin dashboard with Stripe test data:

```bash
npm run seed:stripe
```

This creates:
- 3 test organizations
- 6 groups (2 per org)
- 10 monthly subscriptions

Clean test data:
```bash
npm run seed:stripe:clean
```

**Requirements:**
- Stripe test API key (`sk_test_*`)
- Supabase service role key

**Optional:** Run Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
