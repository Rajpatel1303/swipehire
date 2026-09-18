import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Key,
  AlertCircle,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Sliders,
  Sparkles,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { AdminRoleRecord, AdminMemberRecord } from "../types";
import { useAdmin } from "../app/AdminContext";
import { DataTable, Column } from "../components/common/DataTable";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

interface PermissionItem {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const RBACPage: React.FC = () => {
  const { currentAdmin, hasPermission } = useAdmin();
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [members, setMembers] = useState<AdminMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  const canManageRBAC = hasPermission("rbac.manage");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, membersRes] = await Promise.all([
        AdminApi.getRBACRoles(),
        AdminApi.getRBACAdmins(),
      ]);
      setRoles(rolesRes.roles || []);
      setPermissions(rolesRes.permissions || []);
      setMembers(membersRes.admins || []);
    } catch (err: any) {
      console.error("[RBACPage] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChangeRequest = (member: AdminMemberRecord, newRoleId: string) => {
    const targetRole = roles.find((r) => r.id === newRoleId);
    if (!targetRole) return;

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Role Reassignment",
      message: `Are you sure you want to change ${member.email || member.id}'s role to "${targetRole.name}"? This will immediately alter their backend authorization and system permissions.`,
      onConfirm: async () => {
        try {
          await AdminApi.assignAdminRole(member.id, newRoleId);
          await fetchData();
        } catch (err: any) {
          alert(`Failed to assign role: ${err.message}`);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const columns: Column<AdminMemberRecord>[] = [
    {
      header: "Admin User",
      accessor: (m) => (
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>{m.email}</span>
            {m.id === currentAdmin?.id && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-medium">You</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[240px] mt-0.5" title={m.id}>
            ID: {m.id}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Assigned Role",
      accessor: (m) => {
        const roleObj = roles.find((r) => r.id === m.assignedRole);
        const roleName = roleObj?.name || m.assignedRole || "Admin";

        const getRoleBadge = (roleId?: string) => {
          switch (roleId?.toLowerCase()) {
            case "super_admin":
              return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "admin":
              return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "moderator":
              return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "support":
              return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default:
              return "bg-slate-800 text-slate-400 border-slate-700";
          }
        };

        return (
          <div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(
                m.assignedRole
              )}`}
            >
              <ShieldCheck className="w-3 h-3" />
              {roleName}
            </span>
          </div>
        );
      },
    },
    {
      header: "Assigned Permissions",
      accessor: (m) => {
        if (m.assignedRole === "super_admin") {
          return (
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> All permissions granted (Full System Access)
            </span>
          );
        }

        const roleObj = roles.find((r) => r.id === m.assignedRole);
        const perms = roleObj?.permissions || [];

        return (
          <div className="max-w-md">
            <div className="flex flex-wrap gap-1">
              {perms.length > 0 ? (
                perms.slice(0, 8).map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded"
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No permissions mapped</span>
              )}
              {perms.length > 8 && (
                <span className="text-[10px] font-mono px-1 py-0.5 text-slate-500">
                  +{perms.length - 8} more
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Role Management",
      accessor: (m) => {
        if (!canManageRBAC) {
          return (
            <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-600" /> Read-only
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <select
              value={m.assignedRole || "admin"}
              onChange={(e) => handleRoleChangeRequest(m, e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        );
      },
    },
  ];

  // Group permissions for matrix view safely
  const allPermissions = useMemo(() => {
    if (permissions && permissions.length > 0) {
      return permissions
        .map((p) => {
          const code = p.id || "";
          const cat = p.category || (code.includes(".") ? code.split(".")[0] : "general");
          return {
            id: code,
            name: p.name || code,
            category: cat,
          };
        })
        .sort((a, b) => a.category.localeCompare(b.category));
    }

    // Fallback: extract unique string permission IDs from roles
    const set = new Set<string>();
    roles.forEach((r) => {
      (r.permissions || []).forEach((p) => {
        if (typeof p === "string" && p) set.add(p);
      });
    });

    return Array.from(set)
      .map((code) => ({
        id: code,
        name: code,
        category: code.includes(".") ? code.split(".")[0] : "general",
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [permissions, roles]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
            <Key className="w-4 h-4" />
            Security & Governance
          </div>
          <h2 className="text-xl font-bold text-white">Role-Based Access Control (RBAC)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative team members, enforce granular permission boundaries, and audit roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!canManageRBAC && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Read-Only Mode
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-orange-400" />
            Admin Team Members ({members.length})
          </div>
        </div>

        <DataTable
          data={members}
          columns={columns}
          isLoading={loading}
          searchPlaceholder="Search admin members by email or ID..."
          searchFilter={(m, q) =>
            (m.email || "").toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            (m.assignedRole || "").toLowerCase().includes(q)
          }
        />
      </div>

      {/* Role Permission Matrix */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sliders className="w-4 h-4 text-orange-400" />
          Role Permission Matrix
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Permission Capability</th>
                  <th className="p-3.5">Category</th>
                  {roles.map((r) => (
                    <th key={r.id} className="p-3.5 text-center">
                      <div className="text-white font-bold">{r.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 lowercase">{r.id}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allPermissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{perm.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{perm.id}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                        {perm.category}
                      </span>
                    </td>
                    {roles.map((r) => {
                      const hasPerm =
                        r.id === "super_admin" ||
                        (r.permissions || []).includes(perm.id);
                      return (
                        <td key={r.id} className="p-3.5 text-center">
                          {hasPerm ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-600 inline-block" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};
