import PageShell from "@/components/PageShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PageShell width="wide">{children}</PageShell>;
}
