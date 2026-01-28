import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async redirects() {
    return [
      // Redirect old org detail pages to new org-scoped URLs
      {
        source: '/admin/organizations/:id',
        destination: '/admin/org/:id',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/edit',
        destination: '/admin/org/:id/settings',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/groups',
        destination: '/admin/org/:id/groups',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/groups/:path*',
        destination: '/admin/org/:id/groups/:path*',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/individuals',
        destination: '/admin/org/:id/individuals',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/individuals/:path*',
        destination: '/admin/org/:id/individuals/:path*',
        permanent: true,
      },
      {
        source: '/admin/organizations/:id/report',
        destination: '/admin/org/:id/report',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
