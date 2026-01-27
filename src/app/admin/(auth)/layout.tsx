export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No sidebar for auth pages
  return <>{children}</>;
}
