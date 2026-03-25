<<<<<<< HEAD
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Wallet,
  Users,
  CheckCircle2,
  ArrowRight,
  Upload,
  Building2,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wallet, Users, CheckCircle2, ArrowRight, Upload, Building2, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e

const steps = [
  { id: "welcome", title: "Welcome to WaBiz", icon: MessageSquare },
  { id: "whatsapp", title: "Connect WhatsApp", icon: Phone },
  { id: "wallet", title: "Add Balance", icon: Wallet },
  { id: "contacts", title: "Upload Contacts", icon: Users },
];

<<<<<<< HEAD
const rechargeAmounts = [500, 1000, 2000, 5000];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [portfolio, setPortfolio] = useState("");
  const [number, setNumber] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [uploadedContacts, setUploadedContacts] = useState(false);
  const navigate = useNavigate();
  const {
    completeOnboarding,
    connectWhatsApp,
    addWalletFunds,
    uploadSampleContacts,
    whatsApp,
  } = useAppContext();

  const readyToFinish = useMemo(
    () => whatsApp.connected || selectedAmount > 0 || uploadedContacts,
    [selectedAmount, uploadedContacts, whatsApp.connected],
  );

  const next = async () => {
    if (currentStep === 1 && !whatsApp.connected) {
      await connectWhatsApp({
        connectionStatus: "connected",
        businessVerificationStatus: "unverified",
        accountReviewStatus: "pending_review",
        obaStatus: "not_applied",
        metaBusinessId: "",
        metaBusinessPortfolioId: "",
        wabaId: "",
        phoneNumberId: "",
        displayPhoneNumber: number,
        verifiedName: portfolio,
        businessPortfolio: portfolio,
        businessName: portfolio,
        authorizationStatus: "active",
        authorizationExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast({ title: "WhatsApp linked", description: "Embedded signup completed successfully." });
    }

    if (currentStep === 2 && selectedAmount > 0) {
      await addWalletFunds(selectedAmount, "Onboarding wallet top-up");
      toast({ title: "Balance added", description: `Rs ${selectedAmount.toLocaleString()} added to your wallet.` });
    }

    if (currentStep === 3 && !uploadedContacts) {
      await uploadSampleContacts();
      setUploadedContacts(true);
      toast({ title: "Contacts uploaded", description: "Sample CSV import completed." });
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    await completeOnboarding();
    navigate("/dashboard");
  };

  const skip = async () => {
    await completeOnboarding();
    navigate("/dashboard");
  };
=======
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else navigate("/dashboard");
  };

  const skip = () => navigate("/dashboard");
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
<<<<<<< HEAD
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  i <= currentStep ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
=======
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i <= currentStep ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              {currentStep === 0 && (
                <div className="text-center py-4">
                  <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-8 w-8 text-primary-foreground" />
                  </div>
<<<<<<< HEAD
                  <h2 className="text-2xl font-display font-bold text-foreground mb-3">Welcome to WaBiz</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We&apos;ll help you connect WhatsApp, preload your wallet, and import contacts so your first campaign is ready quickly.
=======
                  <h2 className="text-2xl font-display font-bold text-foreground mb-3">Welcome to WaBiz! 🎉</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Let's set up your WhatsApp Business account in just a few steps. You'll be sending campaigns in no time.
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                  </p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-display font-bold text-foreground mb-2">Connect WhatsApp Business</h2>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">Enter the Meta-connected business portfolio and number you want this workspace to use</p>
=======
                    <p className="text-sm text-muted-foreground">Sign in with Meta to link your WhatsApp account</p>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                  </div>
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="p-4 rounded-lg border border-border">
                      <label className="text-sm font-medium text-foreground mb-2 block">
<<<<<<< HEAD
                        <Building2 className="h-4 w-4 inline mr-2" />
                        Business Portfolio
                      </label>
                      <input
                        value={portfolio}
                        onChange={(event) => setPortfolio(event.target.value)}
                        placeholder="Your Meta business portfolio"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                      />
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        <Phone className="h-4 w-4 inline mr-2" />
                        WhatsApp Number
                      </label>
                      <input
                        value={number}
                        onChange={(event) => setNumber(event.target.value)}
                        placeholder="+91 98XXX XXXXX"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                      />
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                      We will save this mapping to the workspace so campaigns, settings, and verification indicators all reflect the connected number.
                    </div>
=======
                        <Building2 className="h-4 w-4 inline mr-2" />Business Portfolio
                      </label>
                      <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
                        <option>Select portfolio...</option>
                        <option>Acme Enterprises</option>
                      </select>
                    </div>
                    <Button variant="whatsapp" size="lg" className="w-full">
                      <MessageSquare className="h-5 w-5 mr-2" /> Connect WhatsApp
                    </Button>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-display font-bold text-foreground mb-2">Add Wallet Balance</h2>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">Prepaid pricing at Rs 0.50 per message</p>
                  </div>
                  <div className="max-w-sm mx-auto space-y-3">
                    {rechargeAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedAmount(amount)}
                        className={`w-full p-4 rounded-lg border transition-all text-left flex items-center justify-between ${
                          selectedAmount === amount
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        <span className="font-medium text-foreground">Rs {amount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">Approx {Math.floor(amount / 0.5).toLocaleString()} messages</span>
=======
                    <p className="text-sm text-muted-foreground">Prepaid system — pay only for messages you send</p>
                  </div>
                  <div className="max-w-sm mx-auto space-y-3">
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">₹{amt.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">~{amt * 2} messages</span>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-display font-bold text-foreground mb-2">Upload Your Contacts</h2>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">Import a starter CSV dataset so your wizard is ready immediately</p>
                  </div>
                  <div className="max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setUploadedContacts(true)}
                      className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        uploadedContacts ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        {uploadedContacts ? "CSV ready to import" : "Drop your CSV file here"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedContacts ? "We will import 3 sample contacts on continue" : "or click to browse"}
                      </p>
                    </button>
=======
                    <p className="text-sm text-muted-foreground">Import your customer list to get started</p>
                  </div>
                  <div className="max-w-sm mx-auto">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Drop your CSV file here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                    </div>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="px-8 pb-8 flex justify-between">
            <Button variant="ghost" onClick={skip} className="text-muted-foreground">
              Skip for now
            </Button>
<<<<<<< HEAD
            <Button variant="gradient" onClick={next} disabled={currentStep === 3 && !readyToFinish}>
=======
            <Button variant="gradient" onClick={next}>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              {currentStep === steps.length - 1 ? "Go to Dashboard" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
