import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  BriefcaseBusiness,
  Copy,
  HandCoins,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function ResellerPortalPage() {
  const { platform } = useAppContext();
  const reseller = platform.resellerProfile;
  const managedClients = platform.workspaces.filter((workspace) => workspace.resellerId === reseller?.id);

  const handleCopyReferralCode = async () => {
    if (!reseller) {
      return;
    }

    await navigator.clipboard.writeText(reseller.referralCode);
    toast({ title: "Referral code copied", description: `${reseller.referralCode} is ready to share with prospects.` });
  };

  if (!reseller) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-display font-bold text-foreground">Reseller portal</h1>
          <p className="mt-3 text-muted-foreground">
            No reseller profile is attached to this account yet. Sign in with a reseller email to preview the partner experience.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-border bg-card p-8 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Reseller growth desk
              </div>
              <h1 className="mt-5 text-3xl font-display font-bold text-foreground">{reseller.companyName} reseller portal</h1>
              <p className="mt-3 text-muted-foreground">
                Manage your referred clients, track payouts, and keep your partner pipeline organized from one dedicated reseller workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referral code</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">{reseller.referralCode}</p>
                <Button variant="outline" size="sm" onClick={handleCopyReferralCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Clients managed", value: reseller.clientsManaged, icon: Store },
            { label: "Monthly recurring revenue", value: `Rs ${reseller.monthlyRecurringRevenue.toLocaleString()}`, icon: BadgeIndianRupee },
            { label: "Expected payout", value: `Rs ${reseller.monthlyPayout.toLocaleString()}`, icon: HandCoins },
            { label: "Pipeline value", value: `Rs ${reseller.pipelineValue.toLocaleString()}`, icon: BriefcaseBusiness },
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
                <h2 className="font-display text-lg font-semibold text-foreground">Managed client workspaces</h2>
                <p className="text-sm text-muted-foreground mt-1">Track customer health, plan mix, and spend for your book of business</p>
              </div>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add prospect
              </Button>
            </div>
            <div className="divide-y divide-border">
              {managedClients.map((workspace) => (
                <div key={workspace.id} className="px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{workspace.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{workspace.ownerName} • {workspace.ownerEmail}</p>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Plan</p>
                        <p className="mt-1 font-semibold text-foreground">{workspace.plan}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Contacts</p>
                        <p className="mt-1 font-semibold text-foreground">{workspace.activeContacts.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Spend</p>
                        <p className="mt-1 font-semibold text-foreground">Rs {workspace.monthlySpend.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground">Partner status</h2>
              <div className="mt-5 grid gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tier</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{reseller.tier}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{reseller.status}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commission</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{reseller.commissionRate}% revenue share</p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold text-foreground">Suggested reseller workflow</h2>
              <div className="mt-5 space-y-3">
                {[
                  "Share your referral code with leads and agencies.",
                  "Onboard customers into Starter, Growth, or Enterprise plans.",
                  "Track payout-ready accounts and follow up on trials.",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
