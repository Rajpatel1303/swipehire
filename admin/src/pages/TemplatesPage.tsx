import React, { useState, useEffect, useCallback } from "react";
import {
  FileCode,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { CommunicationTemplateRecord } from "../types";
import { AdminModal } from "../components/common/AdminModal";
import { useAdmin } from "../app/AdminContext";

export const TemplatesPage: React.FC = () => {
  const { hasPermission } = useAdmin();
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const [emailTemplates, setEmailTemplates] = useState<CommunicationTemplateRecord[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<CommunicationTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect & Edit
  const [inspectingTemplate, setInspectingTemplate] = useState<CommunicationTemplateRecord | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplateRecord | null>(null);
  const [formData, setFormData] = useState({ title: "", category: "", subject: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

  const canManageComms = hasPermission("communications.manage");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await AdminApi.getCommunicationTemplates();
      setEmailTemplates(res.emailTemplates || []);
      setWhatsAppTemplates(res.whatsAppTemplates || []);
    } catch (err: any) {
      console.error("[TemplatesPage Load Error]:", err);
      setErrorMsg(err.message || "Failed to load templates.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditOpen = (t: CommunicationTemplateRecord) => {
    setEditingTemplate(t);
    setFormData({
      title: t.title,
      category: t.category,
      subject: t.subject || "",
      content: t.body_template || t.message_template || "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setIsSaving(true);

    try {
      const updates: any = {
        title: formData.title,
        category: formData.category,
      };
      if (activeTab === "email") {
        updates.subject = formData.subject;
        updates.bodyTemplate = formData.content;
      } else {
        updates.messageTemplate = formData.content;
      }

      await AdminApi.updateCommunicationTemplate(activeTab, editingTemplate.id, updates);
      setEditingTemplate(null);
      await loadData(true);
    } catch (err: any) {
      alert(`Save Template Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentList = activeTab === "email" ? emailTemplates : whatsAppTemplates;
  const filteredList = currentList.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-indigo-600" />
            Communication Templates
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage recruiter email templates and candidate WhatsApp outreach scripts.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("email")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "email"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Templates ({emailTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "whatsapp"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Templates ({whatsAppTemplates.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search template title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error loading templates</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
          Loading templates...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No communication templates found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.company_id ? "Company Template" : "Platform Default"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{t.title}</h3>
                {t.subject && (
                  <p className="text-xs text-slate-600 font-medium mb-2 truncate">
                    <strong>Subject:</strong> {t.subject}
                  </p>
                )}
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-mono line-clamp-4 whitespace-pre-wrap border border-slate-100 mb-4">
                  {t.body_template || t.message_template}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setInspectingTemplate(t)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                {canManageComms && (
                  <button
                    onClick={() => handleEditOpen(t)}
                    className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {inspectingTemplate && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingTemplate(null)}
          title={inspectingTemplate.title}
          subtitle={`Category: ${inspectingTemplate.category}`}
        >
          <div className="space-y-4 text-xs">
            {inspectingTemplate.subject && (
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Subject</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900">
                  {inspectingTemplate.subject}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Body Template</span>
              <div className="p-4 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap max-h-72">
                {inspectingTemplate.body_template || inspectingTemplate.message_template}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditingTemplate(null)}
          title="Edit Template"
          subtitle={`Template ID: ${editingTemplate.id}`}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {activeTab === "email" && (
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Content / Message</label>
              <textarea
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
