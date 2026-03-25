import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Edit2, Plus, Search, Trash2, Upload, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
=======
import { Users, Upload, Plus, Search, Tag, Trash2, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const mockContacts = [
  { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", tags: ["VIP", "Shopify"] },
  { id: 2, name: "Priya Patel", phone: "+91 87654 32109", tags: ["New"] },
  { id: 3, name: "Amit Kumar", phone: "+91 76543 21098", tags: ["Returning"] },
  { id: 4, name: "Sneha Gupta", phone: "+91 65432 10987", tags: ["VIP", "D2C"] },
  { id: 5, name: "Vikram Singh", phone: "+91 54321 09876", tags: ["Shopify"] },
  { id: 6, name: "Anjali Reddy", phone: "+91 43210 98765", tags: ["New", "D2C"] },
];
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e

const tagColors: Record<string, string> = {
  VIP: "bg-primary/10 text-primary",
  Shopify: "bg-info/10 text-info",
  New: "bg-success/10 text-success",
  Returning: "bg-warning/10 text-warning",
  D2C: "bg-accent/10 text-accent",
<<<<<<< HEAD
  CSV: "bg-muted text-muted-foreground",
  Retail: "bg-muted text-muted-foreground",
};

export default function ContactsPage() {
  const { contacts, addContact, uploadSampleContacts } = useAppContext();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const filtered = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(search.toLowerCase()) ||
          contact.phone.includes(search) ||
          contact.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
      ),
    [contacts, search],
  );

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Missing details", description: "Add both a name and phone number." });
      return;
    }

    await addContact({
      name: name.trim(),
      phone: phone.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    toast({ title: "Contact added", description: `${name.trim()} is ready for your next campaign.` });
    setName("");
    setPhone("");
    setTags("");
    setShowForm(false);
  };

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
                  <Users className="h-4 w-4" />
                  Audience operating layer
                </div>
                <h1 className="mt-5 text-3xl font-display font-bold text-foreground">Build cleaner WhatsApp audience lists for repeatable campaign execution</h1>
                <p className="mt-4 text-muted-foreground">
                  Contacts are now framed as a reusable operating asset: tagged audience segments, CSV imports, and list hygiene that make campaign launches faster and safer.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total contacts</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{contacts.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tagged segments</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{new Set(contacts.flatMap((contact) => contact.tags)).size}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CSV ready</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">Import + enrich</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Contact workspace</h2>
            <p className="text-muted-foreground mt-1">{contacts.length} contacts available for targeting</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await uploadSampleContacts();
                toast({ title: "CSV uploaded", description: "Sample contacts imported successfully." });
              }}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload CSV
            </Button>
            <Button variant="gradient" size="sm" onClick={() => setShowForm((value) => !value)}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground">Add a new audience record</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm"
              />
              <input
                type="text"
                placeholder="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm"
              />
              <input
                type="text"
                placeholder="Tags separated by commas"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddContact}>Save Contact</Button>
            </div>
          </div>
        )}
=======
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground mt-1">{mockContacts.length} contacts in your list</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" /> Upload CSV
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </div>
        </motion.div>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
<<<<<<< HEAD
          className="rounded-[1.5rem] border border-border bg-card shadow-card overflow-hidden"
        >
          <div className="border-b border-border px-6 py-5">
=======
          className="bg-card rounded-xl shadow-card border border-border"
        >
          <div className="p-4 border-b border-border">
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
<<<<<<< HEAD
                onChange={(event) => setSearch(event.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm"
=======
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm"
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
<<<<<<< HEAD
                  <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Phone</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Tags</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Actions</th>
=======
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
<<<<<<< HEAD
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {contact.name.split(" ").map((part) => part[0]).join("")}
=======
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {contact.name.split(" ").map(n => n[0]).join("")}
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                        </div>
                        <span className="text-sm font-medium text-foreground">{contact.name}</span>
                      </div>
                    </td>
<<<<<<< HEAD
                    <td className="px-6 py-5 text-sm text-muted-foreground">{contact.phone}</td>
                    <td className="px-6 py-5">
=======
                    <td className="p-4 text-sm text-muted-foreground">{contact.phone}</td>
                    <td className="p-4">
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                      <div className="flex gap-1.5 flex-wrap">
                        {contact.tags.map((tag) => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
<<<<<<< HEAD
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Edit flow", description: "Inline editing can be added next." })}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast({ title: "Delete not enabled", description: "This MVP keeps sample contacts persistent for now." })}>
=======
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
