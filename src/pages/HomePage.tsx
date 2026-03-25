import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
<<<<<<< HEAD
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  Globe,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  Monitor,
  Package,
  Shield,
  ShoppingCart,
  Smartphone,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import heroPhone from "@/assets/hero-phone.png";

const stats = [
  { value: "99.95%", label: "Platform uptime" },
  { value: "< 5 min", label: "Meta onboarding flow" },
  { value: "₹0.50", label: "Live campaign cost visibility" },
  { value: "24/7", label: "Support readiness" },
];

const trustSignals = [
  "Official Meta onboarding flow",
  "Template-led campaign governance",
  "Prepaid wallet with send controls",
  "Built for Shopify and D2C operations",
];

const enterprisePillars = [
  {
    icon: Shield,
    title: "Meta-grade setup",
    desc: "Connect business portfolio, number, and account status from one controlled onboarding flow.",
  },
  {
    icon: Wallet,
    title: "Finance-safe sending",
    desc: "Know campaign cost before launch, warn on low balance, and block sends when prepaid funds are empty.",
  },
  {
    icon: LayoutTemplate,
    title: "Template-first campaigns",
    desc: "Keep marketing and utility messaging organized with approval-aware templates and reusable journeys.",
  },
  {
    icon: BarChart3,
    title: "Operator visibility",
    desc: "Track wallet usage, campaign performance, contacts, and recent activity from one dashboard.",
  },
];

const useCases = [
  {
    title: "Shopify Brands",
    points: [
      "Recover abandoned carts",
      "Broadcast sale launches and drops",
      "Send shipping and COD confirmation updates",
    ],
  },
  {
    title: "D2C Teams",
    points: [
      "Segment contacts by behavior and tags",
      "Reuse approved templates across campaigns",
      "Control spend with prepaid wallet governance",
    ],
  },
  {
    title: "Local Businesses",
    points: [
      "Run appointment or order reminders",
      "Promote offers to repeat customers",
      "Manage contacts without technical complexity",
    ],
  },
];

const operatingSystem = [
  {
    icon: Building2,
    title: "Onboard",
    desc: "Create workspace, connect WhatsApp Business, add balance, upload contacts.",
  },
  {
    icon: Users,
    title: "Organize",
    desc: "Group customers by tags, list hygiene, and business use case.",
  },
  {
    icon: Megaphone,
    title: "Launch",
    desc: "Pick recipients, choose approved templates, review cost, and send with confidence.",
  },
  {
    icon: Monitor,
    title: "Operate",
    desc: "Track campaign status, wallet deductions, and team-level execution from one system.",
  },
];

const features = [
  { icon: Megaphone, title: "Bulk Messaging", desc: "Send personalized messages to thousands of customers at once without spam issues." },
  { icon: Bot, title: "Automation", desc: "Set up auto-replies, welcome messages, follow-ups, and reminders—so you never miss a lead." },
  { icon: MessageSquare, title: "Chat Management", desc: "Manage all your WhatsApp conversations from one dashboard, even with multiple team members." },
  { icon: Target, title: "Broadcast Campaigns", desc: "Run targeted campaigns for promotions, offers, updates, and announcements." },
  { icon: Users, title: "Lead Generation", desc: "Capture and nurture leads directly through WhatsApp." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Track message performance, delivery, and engagement to improve results." },
  { icon: ShoppingCart, title: "Shopify-ready foundation", desc: "Structured for store events, order messaging, and future catalog workflows." },
  { icon: Shield, title: "Meta-grade security", desc: "Official Meta onboarding flow with template-led campaign governance." },
];

const integrations = ["Shopify", "Meta", "Shiprocket", "Google Sheets", "Zapier", "WooCommerce", "Calendly", "Pabbly"];

const plans = [
  {
    name: "Starter",
    price: "₹5,000",
    period: "6 months",
    features: ["1 workspace", "Template messaging", "Contacts + CSV import", "Wallet and transactions"],
  },
  {
    name: "Growth",
    price: "₹8,000",
    period: "6 months",
    features: ["Broadcast campaigns", "Advanced dashboard", "Priority support", "Shopify-ready structure"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual",
    features: ["Multiple teams", "API and automation roadmap", "Custom onboarding", "Dedicated success support"],
  },
=======
  MessageSquare, Send, Users, BarChart3, ShoppingCart, Bot,
  Zap, Shield, ArrowRight, CheckCircle2, Star, Monitor,
  Smartphone, Globe, Megaphone, Package, Bell
} from "lucide-react";
import heroPhone from "@/assets/hero-phone.png";

const features = [
  { icon: MessageSquare, title: "Real-time Chat", desc: "Chat with customers in real time on a single WhatsApp number" },
  { icon: Megaphone, title: "Bulk Broadcast", desc: "Send marketing campaigns to thousands of contacts instantly" },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Get detailed analytics of your broadcast performance" },
  { icon: ShoppingCart, title: "Product Catalogue", desc: "Share product catalogues directly with your customers" },
  { icon: Bot, title: "Smart Chatbots", desc: "Set up personalized auto-reply chatbots for 24/7 support" },
  { icon: Send, title: "Bulk Media Messages", desc: "Auto-reply with images, videos, documents and more" },
  { icon: Users, title: "Multi-Agent Access", desc: "Get multi-user access on a single WhatsApp number" },
  { icon: Monitor, title: "Team Monitoring", desc: "Monitor your team's customer interactions in real-time" },
  { icon: Package, title: "Order Analytics", desc: "Shopify & WooCommerce order analytics and tracking" },
  { icon: Bell, title: "Order Notifications", desc: "Send automated order updates and delivery notifications" },
  { icon: Zap, title: "Cart Recovery", desc: "Send abandoned cart recovery messages to boost sales" },
  { icon: Shield, title: "Official API", desc: "Built on Meta's official WhatsApp Business API platform" },
];

const integrations = [
  "Shopify", "WooCommerce", "Google Sheets", "Calendly",
  "Shiprocket", "Meta Leads", "Pabbly", "Zapier"
];

const stats = [
  { value: "5,000+", label: "Businesses" },
  { value: "50M+", label: "Messages Sent" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
<<<<<<< HEAD
=======
      {/* Navbar */}
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">WaBiz</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
<<<<<<< HEAD
            <a href="#platform" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Platform</a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
=======
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</a>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
<<<<<<< HEAD
            <Button variant="gradient" size="sm" onClick={() => navigate("/signup")}>Get Started</Button>
=======
            <Button variant="gradient" size="sm" onClick={() => navigate("/signup")}>
              Get Started Free
            </Button>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
          </div>
        </div>
      </nav>

<<<<<<< HEAD
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(205_78%_52%/0.10),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(152_58%_38%/0.10),transparent_45%)]" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.15fr,0.85fr] gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                Direct Meta integration for serious WhatsApp operations
              </div>
              <h1 className="mt-6 text-4xl lg:text-5xl xl:text-6xl font-display font-extrabold tracking-tight text-foreground leading-tight">
                WhatsApp marketing that can
                <span className="text-primary"> help businesses grow faster and manage customers more efficiently</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Everything you need to grow your business: Bulk messaging, automation, chat management, broadcast campaigns, lead generation, and analytics – all in one powerful dashboard.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="gradient" size="lg" onClick={() => navigate("/signup")}>
                  Start Building <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
                  See Product Flow
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {trustSignals.map((signal) => (
                  <div key={signal} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                    {signal}
                  </div>
                ))}
              </div>
              <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item) => (
                  <div key={item.label}>
                    <p className="text-2xl font-display font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
=======
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(152_58%_38%/0.08),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <MessageSquare className="h-4 w-4" />
                Official WhatsApp Business API
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-extrabold text-foreground leading-tight">
                Transform Your{" "}
                <span className="text-primary">Business</span>{" "}
                With WhatsApp
              </h1>
              <p className="text-lg text-muted-foreground mt-6 max-w-lg">
                Best Customer Relationship Management & Marketing using Official WhatsApp Business APIs. One platform for all your messaging needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button variant="gradient" size="lg" onClick={() => navigate("/signup")}>
                  Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
                  Book a Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
<<<<<<< HEAD
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative flex justify-center"
            >
              <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,hsl(152_58%_38%/0.14),transparent_70%)]" />
              <div className="relative z-10 rounded-[2rem] border border-border bg-card/80 p-6 shadow-elevated backdrop-blur">
                <img src={heroPhone} alt="WaBiz product preview" className="mx-auto w-72 lg:w-80 xl:w-96 drop-shadow-2xl" />
              </div>
              <div className="absolute left-0 top-12 z-20 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
                <p className="text-xs font-semibold text-foreground">Wallet Protected</p>
                <p className="text-[11px] text-muted-foreground">Send blocked on low funds</p>
              </div>
              <div className="absolute right-0 top-1/3 z-20 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
                <p className="text-xs font-semibold text-foreground">Meta Connected</p>
                <p className="text-[11px] text-muted-foreground">Portfolio + number mapped</p>
              </div>
              <div className="absolute left-10 bottom-12 z-20 rounded-xl border border-border bg-card px-4 py-3 shadow-card">
                <p className="text-xs font-semibold text-foreground">Cost Before Send</p>
                <p className="text-[11px] text-muted-foreground">Campaign estimate shown upfront</p>
              </div>
=======
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(152_58%_38%/0.12),transparent_70%)]" />
              <img
                src={heroPhone}
                alt="WhatsApp Business Chat Interface"
                className="relative z-10 w-72 lg:w-80 xl:w-96 drop-shadow-2xl"
              />
              {/* Floating labels */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute left-0 top-1/4 bg-card shadow-card border border-border rounded-xl px-4 py-2.5 z-20"
              >
                <p className="text-xs font-semibold text-foreground">Blue Tick ✓</p>
                <p className="text-[10px] text-muted-foreground">Verified Business</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute right-0 top-1/2 bg-card shadow-card border border-border rounded-xl px-4 py-2.5 z-20"
              >
                <p className="text-xs font-semibold text-foreground">Quick Replies</p>
                <p className="text-[10px] text-muted-foreground">Interactive Buttons</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute left-8 bottom-12 bg-card shadow-card border border-border rounded-xl px-4 py-2.5 z-20"
              >
                <p className="text-xs font-semibold text-foreground">Auto Reply</p>
                <p className="text-[10px] text-muted-foreground">24/7 Chatbot</p>
              </motion.div>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
            </motion.div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section id="platform" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Built to feel more like a control layer than a bulk sender
            </h2>
            <p className="mt-4 text-muted-foreground">
              After reviewing Serri-style positioning, the stronger direction for WaBiz is a cleaner, more operational product story: onboarding, compliance, wallet governance, templates, and campaign execution in one enterprise-friendly flow.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {enterprisePillars.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-display font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
=======
      {/* Why WaBiz */}
      <section className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
            Why <span className="text-primary">WaBiz</span> — 1 Company, 1 Chat
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            With the growing customer base and employees, it's hard for a business to keep up with communication on all fronts. That's where WaBiz steps in.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { icon: Zap, label: "Easy to Use Interface" },
              { icon: Shield, label: "Dedicated Support" },
              { icon: Smartphone, label: "Multi Device Support" },
              { icon: Globe, label: "Custom Integrations" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card border border-border text-center hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              </motion.div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section id="use-cases" className="py-20 gradient-subtle border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              One product, shaped for three business motions
            </h2>
            <p className="mt-4 text-muted-foreground">
              This is the part that makes Serri-style positioning useful for us: sharper category clarity. WaBiz should win by being obviously right for Shopify brands, D2C marketers, and local operators.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-card p-7 shadow-card"
              >
                <h3 className="text-xl font-display font-semibold text-foreground">{useCase.title}</h3>
                <div className="mt-5 space-y-3">
                  {useCase.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr,1.1fr] items-start">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                From Meta connection to campaign send in one operating path
              </h2>
              <p className="mt-4 text-muted-foreground">
                Instead of spreading the story across disconnected features, we now frame WaBiz as an operating system. That’s the more suitable route for your product than looking like a services-heavy catalogue site.
              </p>
            </div>
            <div className="grid gap-4">
              {operatingSystem.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-y border-border gradient-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Enterprise-grade product depth</h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                The page now speaks more to platform strength: not just chatbots or broadcasts, but finance controls, workflow safety, and operator visibility.
              </p>
            </div>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-display font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
=======
      {/* Features */}
      <section id="features" className="py-20 gradient-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Key <span className="text-primary">Features</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Make business communication easy with WaBiz's WhatsApp API solutions. Connect effortlessly, engage customers quickly, and run operations smoothly.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:gradient-primary transition-all">
                    <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              </motion.div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section id="integrations" className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Ecosystem-ready from day one</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Built around WhatsApp first, but structured to grow into commerce events, support workflows, and automation rails.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card px-6 py-4 shadow-card"
              >
                <span className="text-sm font-semibold text-foreground">{integration}</span>
=======
      {/* Integrations */}
      <section id="integrations" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
            Popular <span className="text-primary">Integrations</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Experience easy and hassle-free WhatsApp Business integrations with your preferred e-commerce platforms, CRMs, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {integrations.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-4 bg-card rounded-xl shadow-card border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-default"
              >
                <span className="text-sm font-semibold text-foreground">{name}</span>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              </motion.div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section id="pricing" className="py-20 border-y border-border gradient-subtle">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Transparent pricing with room to scale</h2>
            <p className="mt-4 text-muted-foreground">
              Prepaid wallet logic stays product-native, while larger teams can move to enterprise rollout and integration support.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
=======
      {/* Pricing Preview */}
      <section id="pricing" className="py-20 gradient-subtle">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h2>
            <p className="text-muted-foreground mt-4">Pay only for messages you send. No hidden charges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "₹5,000", period: "6 months", features: ["1,000 contacts", "Bulk Broadcast", "Basic Analytics", "Email Support"] },
              { name: "Growth", price: "₹8,000", period: "6 months", features: ["5,000 contacts", "Advanced Broadcast", "Full Analytics", "Priority Support", "Chatbots"], popular: true },
              { name: "Enterprise", price: "Custom", period: "Annual", features: ["Unlimited contacts", "Custom Integrations", "Dedicated Manager", "SLA Guarantee", "API Access"] },
            ].map((plan, i) => (
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
<<<<<<< HEAD
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border bg-card p-8 shadow-card ${plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Best for growing teams
                  </span>
                )}
                <h3 className="text-lg font-display font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-display font-extrabold text-foreground">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">/ {plan.period}</span>
                </div>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className="mt-8 w-full"
                  onClick={() => navigate("/signup")}
                >
                  {plan.price === "Custom" ? "Talk to Sales" : "Get Started"}
=======
                transition={{ delay: i * 0.1 }}
                className={`bg-card rounded-2xl p-8 shadow-card border relative ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-display font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className="w-full mt-8"
                  onClick={() => navigate("/signup")}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
=======
      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
<<<<<<< HEAD
            className="rounded-[2rem] gradient-primary px-8 py-12 text-center shadow-elevated lg:px-16 lg:py-16"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground">
              Build the enterprise version of WhatsApp growth without enterprise complexity
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/85">
              For your product, the more suitable benchmark is the operational clarity of Serri-style positioning, combined with a cleaner SaaS dashboard feel. That’s the direction this landing page now follows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="bg-card text-foreground hover:bg-card/90 shadow-md" onClick={() => navigate("/signup")}>
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>
                Explore Dashboard
=======
            className="gradient-primary rounded-3xl p-12 lg:p-16"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground">
              Ready to Transform Your Business?
            </h2>
            <p className="text-primary-foreground/80 mt-4 max-w-lg mx-auto">
              Join 5,000+ businesses already using WaBiz to engage customers via WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                size="lg"
                className="bg-card text-foreground hover:bg-card/90 shadow-md"
                onClick={() => navigate("/signup")}
              >
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Book a Demo
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

<<<<<<< HEAD
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">WaBiz</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Sales</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 WaBiz. Built for WhatsApp-first growth teams.</p>
=======
      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">WaBiz</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 WaBiz. All rights reserved.</p>
          </div>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
        </div>
      </footer>
    </div>
  );
}
