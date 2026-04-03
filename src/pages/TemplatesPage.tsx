import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  XCircle,
  ChevronLeft,
  Image as ImageIcon,
  Video,
  File,
  Type,
  PlusCircle,
  Trash2,
  ExternalLink,
  Phone,
  MessageSquare,
  Smartphone,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  TemplateButton, 
  TemplateHeader, 
  CreateTemplateInput 
} from "@/lib/api/types";

const statusConfig = {
  Approved: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  Pending: { icon: Clock, className: "bg-warning/10 text-warning" },
  Rejected: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

const CATEGORIES = ["Marketing", "Utility", "Authentication"] as const;
const LANGUAGES = ["English", "Hindi", "Spanish", "Portuguese", "Arabic"] as const;

export default function TemplatesPage() {
  const { templates, createTemplate } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    category: "Marketing",
    language: "English",
    header: { type: "none" },
    body: "",
    footer: "",
    buttons: [],
  });

  const approvedCount = templates.filter((template) => template.status === "Approved").length;

  const handleCreate = async () => {
    if (!formData.name || !formData.body) {
      toast({ title: "Missing fields", description: "Name and Body are required.", variant: "destructive" });
      return;
    }
    try {
      await createTemplate(formData);
      toast({ title: "Template submitted", description: "Your template has been sent to Meta for approval." });
      setIsCreating(false);
      setStep(1);
      setFormData({ name: "", category: "Marketing", language: "English", header: { type: "none" }, body: "", footer: "", buttons: [] }); // Full reset
    } catch (error) {
      toast({ title: "Failed to create template", description: "There was an error saving your template.", variant: "destructive" });
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFormData({
      name: "",
      category: "Marketing",
      language: "English",
      header: { type: "none" },
      body: "",
      footer: "",
      buttons: [],
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    // Validate type based on selection
    const headerType = formData.header?.type;
    if (headerType === "image" && !file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    if (headerType === "video" && !file.type.startsWith("video/")) {
      toast({ title: "Invalid file type", description: "Please upload a video.", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `templates/${headerType}s/${fileName}`;

      const { data, error } = await supabase.storage
        .from("flow-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(80);
      const { data: { publicUrl } } = supabase.storage.from("flow-assets").getPublicUrl(filePath);

      setFormData({
        ...formData,
        header: {
          ...formData.header!,
          type: headerType as any,
          url: publicUrl
        }
      });

      setUploadProgress(100);
      toast({ title: "Upload complete", description: "Your media has been attached to the template." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message || "Failed to upload file.", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const addButton = () => {
    if ((formData.buttons?.length || 0) >= 3) return;
    setFormData(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), { type: "quick_reply", text: "Click Here" }]
    }));
  };

  const updateButton = (index: number, data: Partial<TemplateButton>) => {
    const newButtons = [...(formData.buttons || [])];
    newButtons[index] = { ...newButtons[index], ...data };
    setFormData(prev => ({ ...prev, buttons: newButtons }));
  };

  const removeButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons?.filter((_, i) => i !== index)
    }));
  };

  if (isCreating) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-full">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Library
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Step {step} of 2</span>
              <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${(step / 2) * 100}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            {/* Left: Editor */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-[2rem] border border-border bg-card shadow-card p-8"
              >
                {step === 1 ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-display font-bold">General Details</h2>
                      <p className="text-muted-foreground">Define the purpose and identity of your template.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Template Name</label>
                        <input
                          type="text"
                          placeholder="e.g. seasonal_sale_2024"
                          className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lower case, no spaces (use underscores)</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Category</label>
                        <div className="flex p-1 rounded-xl bg-muted border border-border">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setFormData({ ...formData, category: cat })}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                                formData.category === cat ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Language</label>
                        <select
                          className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          value={formData.language}
                          onChange={e => setFormData({ ...formData, language: e.target.value })}
                        >
                          {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button size="lg" className="rounded-xl px-8" onClick={() => setStep(2)}>
                        Next: Template Design
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-display font-bold">Layout Design</h2>
                      <p className="text-muted-foreground">Craft the message, header, and interactive elements.</p>
                    </div>

                    {/* Header Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Header (Optional)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "none", label: "None", icon: XCircle },
                          { id: "text", label: "Text", icon: Type },
                          { id: "image", label: "Image", icon: ImageIcon },
                          { id: "video", label: "Video", icon: Video },
                          { id: "document", label: "Document", icon: File },
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => setFormData({ ...formData, header: { ...formData.header, type: type.id as any } })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                              formData.header?.type === type.id 
                              ? "bg-primary/10 border-primary text-primary shadow-sm" 
                              : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            <type.icon className="h-4 w-4" />
                            <span className="text-xs font-semibold">{type.label}</span>
                          </button>
                        ))}
                      </div>
                      {formData.header?.type === "text" && (
                        <input
                          type="text"
                          placeholder="Header text..."
                          className="w-full h-11 px-4 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.header.text || ""}
                          onChange={e => setFormData({ ...formData, header: { ...formData.header, text: e.target.value } })}
                        />
                      )}

                      {["image", "video", "document"].includes(formData.header?.type || "") && (
                        <div className="space-y-3">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept={
                              formData.header?.type === "image" ? "image/*" : 
                              formData.header?.type === "video" ? "video/*" : "*"
                            }
                          />
                          
                          {formData.header?.url ? (
                            <div className="p-3 rounded-xl border border-success/20 bg-success/5 flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Send className="h-4 w-4 text-success flex-shrink-0" />
                                <span className="text-xs font-medium text-success truncate">{formData.header.url}</span>
                              </div>
                              <button 
                                onClick={() => setFormData({ ...formData, header: { ...formData.header, url: undefined } })}
                                className="p-1.5 hover:bg-success/10 rounded-lg text-success"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full h-24 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <div className="space-y-2 w-full px-8">
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground animate-pulse text-center">Uploading your {formData.header?.type}...</p>
                                </div>
                              ) : (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                                    <Send className="h-5 w-5 text-primary" />
                                  </div>
                                  <span className="text-xs font-semibold">Click to upload {formData.header?.type}</span>
                                </>
                              )}
                            </Button>
                          )}
                          <p className="text-[10px] text-muted-foreground">Maximum file size: 5MB. Media will be hosted in your Supabase storage.</p>
                        </div>
                      )}
                    </div>

                    {/* Body Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" /> Message Body
                        </h3>
                        <div className="flex items-center gap-3">
                           <Button variant="outline" size="sm" onClick={() => setFormData(p => ({ ...p, body: p.body + "{{1}}" }))}>
                             <PlusCircle className="h-3 w-3 mr-1" /> Variable
                           </Button>
                           <div className="text-[10px] text-muted-foreground">Support vars like {"{{1}}"}</div>
                        </div>
                      </div>
                      <textarea
                        rows={5}
                        placeholder="Write your message here..."
                        className="w-full p-5 rounded-[1.5rem] border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none leading-relaxed"
                        value={formData.body}
                        onChange={e => setFormData({ ...formData, body: e.target.value })}
                      />
                    </div>

                    {/* Footer Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Footer (Optional)</h3>
                      <input
                        type="text"
                        placeholder="e.g. Type STOP to unsubscribe"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-background outline-none"
                        value={formData.footer}
                        onChange={e => setFormData({ ...formData, footer: e.target.value })}
                      />
                    </div>

                    {/* Buttons Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Buttons (Max 3)
                        </h3>
                        {(formData.buttons?.length || 0) < 3 && (
                          <Button variant="ghost" size="sm" onClick={addButton} className="text-primary hover:text-primary hover:bg-primary/10">
                            Add Button
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {formData.buttons?.map((btn, idx) => (
                          <div key={idx} className="flex gap-3 items-start p-4 bg-muted/30 rounded-2xl border border-border group animate-in slide-in-from-top-2">
                             <div className="flex-1 space-y-3">
                               <div className="flex gap-2">
                                 {["quick_reply", "url", "phone"].map(type => (
                                   <button 
                                      key={type}
                                      onClick={() => updateButton(idx, { type: type as any })}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                        btn.type === type ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
                                      }`}
                                   >
                                      {type.replace("_", " ")}
                                   </button>
                                 ))}
                               </div>
                               <div className="grid gap-3 sm:grid-cols-2">
                                  <input 
                                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm" 
                                    placeholder="Button Label"
                                    value={btn.text}
                                    onChange={e => updateButton(idx, { text: e.target.value })}
                                  />
                                  {btn.type === "url" && (
                                    <input 
                                      className="h-10 px-3 rounded-lg border border-border bg-background text-sm" 
                                      placeholder="https://example.com"
                                      value={btn.url || ""}
                                      onChange={e => updateButton(idx, { url: e.target.value })}
                                    />
                                  )}
                                  {btn.type === "phone" && (
                                    <input 
                                      className="h-10 px-3 rounded-lg border border-border bg-background text-sm" 
                                      placeholder="+91..."
                                      value={btn.phoneNumber || ""}
                                      onChange={e => updateButton(idx, { phoneNumber: e.target.value })}
                                    />
                                  )}
                               </div>
                             </div>
                             <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeButton(idx)}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border">
                      <Button variant="outline" size="lg" className="rounded-xl px-8" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button size="lg" variant="gradient" className="rounded-xl px-12" onClick={handleCreate}>
                        Submit for Approval
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Real-time Preview */}
            <div className="relative">
              <div className="sticky top-8 space-y-4">
                <div className="flex items-center justify-between px-4">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp Preview</h4>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                     <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                     Live
                   </div>
                </div>
                
                <div className="relative mx-auto w-full aspect-[9/18.5] max-w-[320px] rounded-[3rem] border-8 border-slate-900 bg-slate-950 shadow-2xl overflow-hidden">
                   {/* Notch */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-3xl z-10" />
                   
                   {/* App Header */}
                   <div className="h-16 bg-[#075e54] flex items-end px-6 pb-2">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-white/20" />
                         <div className="h-3 w-24 rounded-full bg-white/20" />
                      </div>
                   </div>

                   {/* Chat bg */}
                   <div className="h-full bg-[#ece5dd] p-4 pt-8">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={JSON.stringify(formData)}
                        className="bg-white rounded-2xl p-0 shadow-sm overflow-hidden"
                      >
                         {/* Header Media */}
                         {formData.header?.type !== "none" && (
                           <div className="aspect-video bg-muted/30 flex items-center justify-center border-b border-border border-dashed">
                              {formData.header?.type === "text" ? (
                                <span className="font-bold text-sm px-4 text-slate-800">{formData.header.text || "Header Text"}</span>
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                   {formData.header?.type === "image" && <ImageIcon className="h-8 w-8" />}
                                   {formData.header?.type === "video" && <Video className="h-8 w-8" />}
                                   {formData.header?.type === "document" && <File className="h-8 w-8" />}
                                   <span className="text-[10px] uppercase font-bold tracking-tighter">Media Asset</span>
                                </div>
                              )}
                           </div>
                         )}

                         <div className="p-4 space-y-2">
                           <div className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                             {formData.body || "Hi, this is your message body..."}
                           </div>
                           {formData.footer && (
                             <div className="text-[11px] text-muted-foreground">
                               {formData.footer}
                             </div>
                           )}
                           <div className="flex justify-end pr-1 pt-1">
                             <span className="text-[10px] text-muted-foreground uppercase">10:45 AM</span>
                           </div>
                         </div>

                         {/* Buttons */}
                         {(formData.buttons?.length || 0) > 0 && (
                           <div className="border-t border-border flex flex-col divide-y divide-border bg-muted/5">
                             {formData.buttons?.map((btn, i) => (
                               <div key={i} className="py-2.5 px-4 flex items-center justify-center gap-2 text-[#075e54] text-xs font-semibold hover:bg-muted/30 transition-colors">
                                  {btn.type === "url" && <ExternalLink className="h-3.5 w-3.5" />}
                                  {btn.type === "phone" && <Phone className="h-3.5 w-3.5" />}
                                  {btn.type === "quick_reply" && <MessageSquare className="h-3.5 w-3.5" />}
                                  {btn.text || "Button Label"}
                               </div>
                             ))}
                           </div>
                         )}
                      </motion.div>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted border border-border">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    This is a visual approximation. Final rendering may vary slightly on different WhatsApp clients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-border bg-card shadow-card overflow-hidden"
        >
          <div className="relative px-8 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(205_78%_52%/0.10),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(152_58%_38%/0.10),transparent_40%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Meta-approved templates
                </div>
                <h1 className="mt-5 text-3xl font-display font-bold text-foreground">Marketing & Utility Governance</h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Manage the approved messaging layers that power your automation engine. Templates here are synced with Meta's approval status, ensuring governance across every campaign.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Library</p>
                  <p className="mt-2 text-sm font-bold text-foreground">{templates.length} Active</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Certified</p>
                  <p className="mt-2 text-sm font-bold text-foreground">{approvedCount} Approved</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Language</p>
                  <p className="mt-2 text-sm font-bold text-foreground">Multi-lingual</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Template Library</h2>
            <p className="text-muted-foreground text-sm mt-1">Review and manage your pre-approved message blocks</p>
          </div>
          <Button variant="gradient" className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Template
          </Button>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {templates.map((template, index) => {
              const statusInfo = statusConfig[template.status as keyof typeof statusConfig];
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-[1.5rem] border border-border bg-card p-6 shadow-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10 text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-display font-bold text-foreground">{template.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-tighter ${statusInfo.className}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {template.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          <span>{template.category}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{template.language}</span>
                        </div>
                      </div>
                    </div>
                    {template.status === "Approved" ? (
                      <Button variant="outline" size="sm" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <Send className="h-3.5 w-3.5 mr-2" /> Use Template
                      </Button>
                    ) : (
                       <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground pointer-events-none">
                         Syncing with Meta...
                       </Button>
                    )}
                  </div>
                  
                  <div className="relative group/preview mt-4">
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none rounded-2xl border-2 border-primary/20 flex items-center justify-center">
                       <span className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl">View Details</span>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/40 p-5 font-mono text-sm text-foreground line-clamp-3 leading-relaxed">
                      {template.preview}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

