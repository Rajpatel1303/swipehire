import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  UserX,
  DollarSign,
  Briefcase,
  Building2,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { MarketplaceBidRecord, BlindProfileRecord, MarketplaceMetrics } from "../types";
import { StatCard } from "../components/common/StatCard";
import { DataTable, Column } from "../components/common/DataTable";
import { AdminModal } from "../components/common/AdminModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAdmin } from "../app/AdminContext";

export const MarketplacePage: React.FC = () => {
  const { hasPermission } = useAdmin();
  const [activeTab, setActiveTab] = useState<"bids" | "profiles">("bids");
  const [metrics, setMetrics] = useState<MarketplaceMetrics | null>(null);
  const [bids, setBids] = useState<MarketplaceBidRecord[]>([]);
  const [profiles, setProfiles] = useState<BlindProfileRecord[]>([]);
  const [totalBids, setTotalBids] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect & Action
  const [inspectingBid, setInspectingBid] = useState<MarketplaceBidRecord | null>(null);
  const [inspectingProfile, setInspectingProfile] = useState<BlindProfileRecord | null>(null);
  const [actionBid, setActionBid] = useState<{ bid: MarketplaceBidRecord; action: "expire" | "cancel" } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const canManageMarketplace = hasPermission("marketplace.manage");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);

    try {
      const [mRes, bidsRes, profsRes] = await Promise.all([
        AdminApi.getMarketplaceMetrics(),
        AdminApi.getMarketplaceBids({
          page,
          limit: pageSize,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        }),
        AdminApi.getMarketplaceProfiles(),
      ]);

      setMetrics(mRes);
      setBids(bidsRes.bids || []);
      setTotalBids(bidsRes.total || 0);
      setProfiles(profsRes || []);
    } catch (err: any) {
      console.error("[MarketplacePage Load Error]:", err);
      setErrorMsg(err.message || "Failed to load marketplace data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBidAction = async () => {
    if (!actionBid) return;
    setIsActing(true);
    try {
      await AdminApi.actionMarketplaceBid(actionBid.bid.id, actionBid.action);
      setActionBid(null);
      await loadData(true);
    } catch (err: any) {
      alert(`Action Failed: ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  const bidColumns: Column<MarketplaceBidRecord>[] = [
    {
      key: "job_title",
      header: "Opportunity & Offer",
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{b.job_title}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
            <span className="font-mono font-bold text-emerald-700">{b.salary_offer}</span>
            <span>•</span>
            <span>{b.seniority_tier}</span>
            <span>•</span>
            <span>{b.work_mode}</span>
          </div>
        </div>
      ),
    },
    {
      key: "company_id",
      header: "Bidding Company",
      render: (b) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-xs text-slate-800">
            {b.companies?.company_name || b.company_id}
          </span>
        </div>
      ),
    },
    {
      key: "candidate_revealed_name",
      header: "Candidate",
      render: (b) => {
        if (b.candidate_revealed_name) {
          return (
            <span className="font-bold text-xs text-slate-900">
              {b.candidate_revealed_name}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <UserX className="w-3 h-3 text-slate-400" />
            {b.blind_talent_id ? `Blind #${b.blind_talent_id.slice(-6)}` : "Anonymous"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Bid Status",
      render: (b) => {
        const statusConfig: Record<string, { label: string; variant: "success" | "danger" | "warning" | "info" | "neutral" }> = {
          accepted: { label: "ACCEPTED", variant: "success" },
          pending: { label: "PENDING", variant: "warning" },
          countered: { label: "COUNTERED", variant: "info" },
          company_countered: { label: "CO-COUNTERED", variant: "info" },
          rejected: { label: "REJECTED", variant: "danger" },
          expired: { label: "EXPIRED", variant: "neutral" },
        };
        const cfg = statusConfig[b.status] || { label: b.status.toUpperCase(), variant: "neutral" };
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: "expires_at",
      header: "72h Fast-Track SLA",
      render: (b) => {
        const isExpired = new Date(b.expires_at).getTime() < Date.now();
        return (
          <span className={`text-[11px] font-mono ${isExpired ? "text-slate-400" : "text-amber-700 font-bold"}`}>
            {isExpired ? "Expired" : new Date(b.expires_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectingBid(b)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Inspect Bid"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canManageMarketplace && b.status === "pending" && (
            <button
              onClick={() => setActionBid({ bid: b, action: "expire" })}
              className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
              title="Force Expire Bid"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-orange-600" />
            Marketplace Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Reverse talent bids, anonymous candidate profiles, and 72-hour fast-track monitoring.
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Blind Profiles"
          value={metrics ? metrics.activeProfiles.toLocaleString() : "—"}
          icon={UserX}
          subtitle="Listed in reverse marketplace"
          colorVariant="primary"
        />
        <StatCard
          title="Active Bids"
          value={metrics ? metrics.activeBids.toLocaleString() : "—"}
          icon={DollarSign}
          subtitle="Under recruiter consideration"
          colorVariant="warning"
        />
        <StatCard
          title="Accepted Hires"
          value={metrics ? metrics.acceptedBids.toLocaleString() : "—"}
          icon={CheckCircle2}
          subtitle="Candidate unmasked"
          colorVariant="success"
        />
        <StatCard
          title="Expired / Closed Bids"
          value={metrics ? metrics.expiredBids.toLocaleString() : "—"}
          icon={Clock}
          subtitle="72-hour SLA elapsed"
          colorVariant="neutral"
        />
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("bids")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bids"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Talent Bids ({totalBids})
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "profiles"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Blind Profiles ({profiles.length})
          </button>
        </div>

        {activeTab === "bids" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="all">All Bids</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="countered">Countered</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error loading marketplace data</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Content View */}
      {activeTab === "bids" ? (
        <DataTable
          columns={bidColumns}
          data={bids}
          keyExtractor={(b) => b.id}
          isLoading={isLoading}
          emptyMessage="No marketplace talent bids found matching your filters."
          pagination={{
            currentPage: page,
            pageSize,
            totalItems: totalBids,
            onPageChange: setPage,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    {p.anonymous_handle || `Blind #${p.id.slice(-6)}`}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.is_listed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.is_listed ? "Listed" : "Unlisted"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{p.headline}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                  <span>{p.experience_years}y Exp</span>
                  <span>•</span>
                  <span>{p.location}</span>
                  <span>•</span>
                  <span>{p.work_preference}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Target Compensation
                  </span>
                  <span className="font-bold text-xs text-slate-900">{p.target_salary_range}</span>
                </div>

                {Array.isArray(p.preferred_roles) && p.preferred_roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.preferred_roles.slice(0, 3).map((r, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {p.active_bids_count || 0} active bids
                </span>
                <button
                  onClick={() => setInspectingProfile(p)}
                  className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bid Inspector Modal */}
      {inspectingBid && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingBid(null)}
          title={`Talent Bid: ${inspectingBid.job_title}`}
          subtitle={`Bid ID: ${inspectingBid.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Company</span>
                <span className="font-bold text-slate-900">{inspectingBid.companies?.company_name || inspectingBid.company_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className="font-bold text-orange-600 uppercase">{inspectingBid.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Compensation Offer</span>
                <span className="font-mono font-bold text-emerald-700">{inspectingBid.salary_offer}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Expires At</span>
                <span className="font-mono text-slate-800">{new Date(inspectingBid.expires_at).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Company Pitch Message</span>
              <div className="p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800">
                {inspectingBid.pitch_message}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Candidate Revelation Status</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {inspectingBid.candidate_revealed_name ? (
                  <p className="font-bold text-emerald-700">
                    Revealed: {inspectingBid.candidate_revealed_name}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Identity protected under anonymous marketplace protocol until candidate formally accepts bid.
                  </p>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Profile Inspector Modal */}
      {inspectingProfile && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingProfile(null)}
          title={inspectingProfile.anonymous_handle || "Blind Candidate Profile"}
          subtitle={`Profile ID: ${inspectingProfile.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Experience</span>
                <span className="font-bold text-slate-900">{inspectingProfile.experience_years} Years</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Work Preference</span>
                <span className="font-bold text-slate-900">{inspectingProfile.work_preference}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Location</span>
                <span className="font-bold text-slate-900">{inspectingProfile.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Comp</span>
                <span className="font-mono font-bold text-emerald-700">{inspectingProfile.target_salary_range}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Availability</span>
              <p className="font-medium text-slate-800">{inspectingProfile.availability_notice}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Verified Proof of Work / Skills</span>
              <pre className="p-3 bg-slate-50 text-slate-700 font-mono text-[11px] rounded-xl border border-slate-200 overflow-x-auto max-h-48">
                {JSON.stringify(inspectingProfile.verified_skills || {}, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Bid Action Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!actionBid}
        onClose={() => setActionBid(null)}
        onConfirm={handleBidAction}
        title="Confirm Marketplace Action"
        message={`Are you sure you want to mark bid #${actionBid?.bid.id} as expired? This is an administrative override and will be logged.`}
        confirmText="Confirm Action"
        variant="danger"
        isLoading={isActing}
      />
    </div>
  );
};
