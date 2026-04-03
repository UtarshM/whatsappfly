import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Building2,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";

export default function AdminPanelPage() {
  const { platform } = useAppContext();

  const activeResellers = platform.resellers.filter((reseller) => reseller.status === "Active");
  const pendingResellers = platform.resellers.filter((reseller) => reseller.status === "Pending");
  const activeWorkspaces = platform.workspaces.filter((workspace) => workspace.billingStatus === "Active");
  const monthlyPlatformRevenue = platform.workspaces.reduce((sum, workspace) => sum + workspace.monthlySpend, 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-border bg-card p-8 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" />
                Platform control plane
              </div>
              <h1 className="mt-5 text-3xl font-display font-bold text-foreground">Admin panel for WaBiz operations, resellers, and customer workspaces</h1>
              <p className="mt-3 text-muted-foreground">
                This panel gives you one place to monitor reseller growth, workspace health, billing risk, and the overall partner channel.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin view</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Role: Platform Admin</p>
              <p className="mt-1 text-xs text-muted-foreground">{platform.alerts.length} platform alerts need tracking</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Live workspaces", value: activeWorkspaces.length, icon: Building2 },
            { label: "Active resellers", value: activeResellers.length, icon: UserRoundCog },
            { label: "Pending approvals", value: pendingResellers.length, icon: AlertTriangle },
            { label: "Monthly GMV", value: `Rs ${monthlyPlatformRevenue.toLocaleString()}`, icon: BadgeIndianRupee },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-display font-bold text-foreground">{item.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <section className="rounded-[1.5rem] border border-border bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Reseller management</h2>
                <p className="text-sm text-muted-foreground mt-1">Track tiers, commission posture, and onboarding progress</p>
              </div>
              <Button variant="outline" size="sm">Invite reseller</Button>
            </div>
            <div className="divide-y divide-border">
              {platform.resellers.map((reseller) => (
                <div key={reseller.id} className="px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{reseller.companyName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{reseller.name} • {reseller.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{reseller.tier}</span>
                        <span className={`rounded-full px-3 py-1 ${
                          reseller.status === "Active"
                            ? "bg-success/10 text-success"
                            : reseller.status === "Pending"
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                        }`}
                        >
                          {reseller.status}
                        </span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{reseller.commissionRate}% commission</span>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Clients</p>
                        <p className="mt-1 font-semibold text-foreground">{reseller.clientsManaged}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">MRR</p>
                        <p className="mt-1 font-semibold text-foreground">Rs {reseller.monthlyRecurringRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Payout</p>
                        <p className="mt-1 font-semibold text-foreground">Rs {reseller.monthlyPayout.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground">Platform alerts</h2>
              <div className="mt-5 space-y-3">
                {platform.alerts.map((alert) => (
                  <div key={alert.id} className={`rounded-xl border p-4 ${
                    alert.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : alert.severity === "warning"
                        ? "border-warning/30 bg-warning/10"
                        : "border-border bg-muted/30"
                  }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground">Workspace rollout queue</h2>
              <div className="mt-5 space-y-4">
                {platform.workspaces.map((workspace) => (
                  <div key={workspace.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{workspace.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{workspace.ownerName} • {workspace.ownerEmail}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        workspace.billingStatus === "Active"
                          ? "bg-success/10 text-success"
                          : workspace.billingStatus === "Trial"
                            ? "bg-info/10 text-info"
                            : "bg-destructive/10 text-destructive"
                      }`}
                      >
                        {workspace.billingStatus}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{workspace.plan} plan</span>
                      <span>{workspace.activeContacts.toLocaleString()} contacts</span>
                      <span>Rs {workspace.monthlySpend.toLocaleString()} monthly spend</span>
                      <span>{workspace.resellerName ?? "Direct sales"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Suggested admin next steps</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              "Approve or suspend resellers from a dedicated workflow.",
              "Assign customer workspaces to a reseller and track payouts.",
              "Expand this panel into a full platform billing and support console.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
