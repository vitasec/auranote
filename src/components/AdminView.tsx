import React, { useState } from "react";
import { UserAccount } from "../types";
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  ShieldAlert, 
  RefreshCw, 
  Lock, 
  Mail, 
  User, 
  Check, 
  X,
  Plus,
  Shield,
  Activity
} from "lucide-react";

interface AdminViewProps {
  accounts: UserAccount[];
  currentUser: UserAccount;
  onUpdateAccounts: (updatedList: UserAccount[]) => void;
}

export default function AdminView({
  accounts,
  currentUser,
  onUpdateAccounts
}: AdminViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  
  // Modal & Form States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");

  // Create fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");

  // Info Feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditPassword(user.passwordHash);
    setEditRole(user.role);
    setEditStatus(user.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      triggerToast("Error: Profile name and email address are required.");
      return;
    }

    // Check email duplicates in other users
    const emailDup = accounts.some(
      (acc) => acc.email.toLowerCase() === editEmail.trim().toLowerCase() && acc.id !== editingUser.id
    );
    if (emailDup) {
      triggerToast("Error: Another account is already registered with this email.");
      return;
    }

    const updated = accounts.map((acc) => {
      if (acc.id === editingUser.id) {
        return {
          ...acc,
          fullName: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          passwordHash: editPassword,
          role: editRole,
          status: editStatus
        };
      }
      return acc;
    });

    onUpdateAccounts(updated);
    setIsEditModalOpen(false);
    setEditingUser(null);
    triggerToast(`Successfully updated account for "${editName.trim()}"`);
    
    // If the admin edited themselves, let a dynamic event update current profile
    if (editingUser.id === currentUser.id) {
      window.dispatchEvent(new CustomEvent("parknote_admin_self_updated", { detail: { name: editName, email: editEmail } }));
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanName = newName.trim();
    const cleanEmail = newEmail.trim().toLowerCase();
    
    if (!cleanName || !cleanEmail || !newPassword) {
      triggerToast("Error: All fields are required to seed an account.");
      return;
    }

    // Check duplicate email
    const duplicate = accounts.some(acc => acc.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      triggerToast("Error: Account email is already taken.");
      return;
    }

    const newAcc: UserAccount = {
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      email: cleanEmail,
      fullName: cleanName,
      passwordHash: newPassword,
      role: newRole,
      avatarStyle: "miniavs",
      avatarSeed: cleanName,
      createdAt: new Date().toISOString(),
      status: "active",
      notesCount: 0
    };

    onUpdateAccounts([newAcc, ...accounts]);
    setIsCreateModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    triggerToast(`Successfully seeded live database record for "${cleanName}"`);
  };

  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      triggerToast("Access Denied: You cannot delete your own active Admin workspace session!");
      return;
    }
    const acc = accounts.find(a => a.id === userId);
    if (acc) {
      setUserToDelete(acc);
    }
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const filtered = accounts.filter(acc => acc.id !== userToDelete.id);
    onUpdateAccounts(filtered);
    triggerToast(`Permanently deleted records for user account "${userToDelete.fullName}"`);
    setUserToDelete(null);
  };

  const toggleUserStatus = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      triggerToast("Workspace Guard: You cannot suspend your own active admin session.");
      return;
    }

    const updatedStatus = user.status === "active" ? "suspended" : "active";
    const updated = accounts.map(acc => {
      if (acc.id === user.id) {
        return { ...acc, status: updatedStatus as "active" | "suspended" };
      }
      return acc;
    });

    onUpdateAccounts(updated);
    triggerToast(`Status changed to ${updatedStatus.toUpperCase()} for "${user.fullName}"`);
  };

  // Filter Accounts List
  const filteredAccounts = accounts.filter(acc => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      acc.fullName.toLowerCase().includes(query) || 
      acc.email.toLowerCase().includes(query) || 
      acc.role.toLowerCase().includes(query);
    
    const matchesRole = roleFilter === "all" ? true : acc.role === roleFilter;
    const matchesStatus = statusFilter === "all" ? true : acc.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate Metrics
  const totalUsersCount = accounts.length;
  const activeUsersCount = accounts.filter(a => a.status === "active").length;
  const suspendedUsersCount = accounts.filter(a => a.status === "suspended").length;
  const adminUsersCount = accounts.filter(a => a.role === "admin").length;

  return (
    <div id="admin-management-view" className="space-y-6 animate-fade-in max-w-6xl mx-auto font-sans pb-16">
      
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div id="admin-toast-hud" className="fixed top-18 right-5 z-55 bg-[#2B2930] border-2 border-[#D0BCFF] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm animate-bounce">
          <ShieldAlert className="h-5 w-5 text-[#A1F000]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-3xl border border-[#D0BCFF]/20 bg-gradient-to-r from-[#211F26] to-[#1D1B20] relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#A1F000]/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#A1F000]" />
            <h1 className="text-xl font-bold uppercase tracking-wider text-white">Accounts Database Coordinator</h1>
          </div>
          <p className="text-[#CAC4D0] text-xs leading-relaxed max-w-xl">
            Audit, register, toggle state status or adjust roles for active IMAT scholars. Workspace runs dynamic localStorage persistence sync.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#A1F000] hover:bg-[#b0ff1a] text-[#0E0D10] px-4.5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create User Record</span>
        </button>
      </div>

      {/* STATS BENTO ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#D0BCFF]/10 text-[#D0BCFF]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Total Records</h3>
            <p className="text-xl font-extrabold text-white mt-0.5">{totalUsersCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-950/20 text-[#A1F000]">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Active Users</h3>
            <p className="text-xl font-extrabold text-[#A1F000] mt-0.5">{activeUsersCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-950/20 text-red-400">
            <UserMinus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Suspended</h3>
            <p className="text-xl font-extrabold text-red-400 mt-0.5">{suspendedUsersCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#49454F]/40 text-blue-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Database Admins</h3>
            <p className="text-xl font-extrabold text-blue-300 mt-0.5">{adminUsersCount}</p>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER PANELS */}
      <div className="rounded-2xl border border-[#49454F]/30 bg-[#211F26] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        
        {/* Search bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts catalog by user name, emails, or attributes..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1D1B20] text-white border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs font-sans placeholder-zinc-500 font-medium"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        </div>

        {/* Filters Select boxes */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center gap-1.5 bg-[#121214] border border-[#49454F]/30 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent text-white border-none text-[11px] focus:outline-none font-sans font-bold cursor-pointer"
            >
              <option value="all" className="bg-[#1D1B20]">All Roles</option>
              <option value="admin" className="bg-[#1D1B20]">Admin</option>
              <option value="user" className="bg-[#1D1B20]">Regular User</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#121214] border border-[#49454F]/30 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-white border-none text-[11px] focus:outline-none font-sans font-bold cursor-pointer"
            >
              <option value="all" className="bg-[#1D1B20]">All Status</option>
              <option value="active" className="bg-[#1D1B20]">Active Only</option>
              <option value="suspended" className="bg-[#1D1B20]">Suspended</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            className="h-9 px-3.5 rounded-xl border border-[#49454F]/40 text-zinc-300 hover:text-white text-xs font-sans font-bold uppercase transition hover:bg-white/5 shrink-0"
          >
            Clear Fields
          </button>
        </div>

      </div>

      {/* CORE INTERACTIVE USER LIST TABLE DATABASE */}
      <div className="rounded-3xl border border-[#49454F]/30 bg-[#211F26] overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs font-sans">
            
            <thead className="bg-[#1D1B20] text-[#938F99] text-[9px] uppercase tracking-widest font-extrabold border-b border-[#49454F]/40 select-none">
              <tr>
                <th className="py-4.5 px-6">Avatar &amp; Scholar</th>
                <th className="py-4.5 px-4">Contact Info</th>
                <th className="py-4.5 px-4 text-center">Security Status</th>
                <th className="py-4.5 px-4 text-center">Assigned Role</th>
                <th className="py-4.5 px-4">Workspace Added</th>
                <th className="py-4.5 px-6 text-right">Actions Panel</th>
              </tr>
            </thead>

            {/* Table Entries */}
            <tbody className="divide-y divide-[#49454F]/20 text-[#E6E1E5]">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`transition hover:bg-white/[2%] ${
                      user.id === currentUser.id ? "bg-[#D0BCFF]/5" : ""
                    }`}
                  >
                    
                    {/* AVATAR + NAME */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D0BCFF]/30 select-none bg-[#121214]">
                          <img 
                            src={`https://api.dicebear.com/9.x/${user.avatarStyle || "miniavs"}/svg?seed=${user.avatarSeed || "Alex"}`} 
                            alt={user.fullName} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{user.fullName}</span>
                            {user.id === currentUser.id && (
                              <span className="text-[8px] bg-[#A1F000]/20 text-[#A1F000] border border-[#A1F000]/30 px-1.5 py-0.5 rounded-md font-extrabold uppercase font-mono tracking-wider">
                                Current You
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-[#938F99] font-mono leading-none">{user.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL + PASSWORD OVERVIEW */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-zinc-200 font-medium block">{user.email}</span>
                        <span className="text-[9px] text-[#938F99] font-mono block">Pass Key: {user.passwordHash}</span>
                      </div>
                    </td>

                    {/* SECURITY STATUS */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user)}
                        disabled={user.id === currentUser.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition select-none ${
                          user.id === currentUser.id 
                            ? "opacity-55 cursor-not-allowed bg-emerald-950/25 border-emerald-900/40 text-[#A1F000]"
                            : user.status === "active"
                              ? "bg-emerald-950/15 border-emerald-900/40 text-[#A1F000] hover:bg-red-950/20 hover:border-red-900/45 hover:text-red-400 cursor-pointer"
                              : "bg-red-950/15 border-red-900/40 text-red-400 hover:bg-emerald-950/20 hover:border-emerald-950/45 hover:text-[#A1F000] cursor-pointer"
                        }`}
                        title={user.id === currentUser.id ? "Cannot suspend yourself" : "Click to toggle security state"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-[#A1F000] animate-pulse" : "bg-red-500"}`} />
                        <span>{user.status}</span>
                      </button>
                    </td>

                    {/* ROLE ASSIGNMENT */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        user.role === "admin"
                          ? "bg-blue-950 text-blue-300 border border-blue-900/60"
                          : "bg-zinc-850 text-zinc-400 border border-zinc-800"
                      }`}>
                        {user.role === "admin" && <Shield className="h-3 w-3" />}
                        <span>{user.role}</span>
                      </span>
                    </td>

                    {/* CREATION STAMP */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-[#938F99] font-mono font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </td>

                    {/* ACTIONS PANEL */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-xl border border-[#49454F]/40 bg-[#1D1B20] text-zinc-300 hover:text-white hover:border-[#D0BCFF] transition cursor-pointer"
                          title="Edit complete record fields"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          disabled={user.id === currentUser.id}
                          className={`p-1.5 rounded-xl border transition ${
                            user.id === currentUser.id
                              ? "opacity-35 border-zinc-800 text-zinc-600 cursor-not-allowed"
                              : "border-[#49454F]/40 bg-[#1D1B20] text-red-400 hover:bg-red-950/25 hover:border-red-900/50 cursor-pointer"
                          }`}
                          title={user.id === currentUser.id ? "Cannot delete yourself" : "Permanently wipe record"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 italic">
                    No active accounts found matching the chosen search queries or dynamic filters.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* DYNAMIC COMPONENT MODAL: SEED NEW ACCOUNT (CREATE) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#1D1B20] border border-[#D0BCFF]/30 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-[#49454F]/30 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <UserCheck className="h-4.5 w-4.5 text-[#A1F000]" />
                <span>Seed User Record</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 font-sans">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Scholar Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Email Code:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john@imt.it"
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Security Password:</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose access password..."
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl placeholder-zinc-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Assigned Role Authority:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("user")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      newRole === "user"
                        ? "bg-[#D0BCFF]/15 border-[#D0BCFF] text-[#D0BCFF]"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    }`}
                  >
                    Regular Scholar User
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      newRole === "admin"
                        ? "bg-[#A1F000]/15 border-[#A1F000] text-[#A1F000]"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    }`}
                  >
                    System Database Admin
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-[#49454F]/50 text-xs font-bold uppercase hover:bg-white/5 transition text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#A1F000] text-black font-extrabold text-xs uppercase tracking-wide rounded-xl hover:bg-[#b0ff1a] transition cursor-pointer"
                >
                  Seed Scholar Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC COMPONENT MODAL: DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#1D1B20] border border-red-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#49454F]/30 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <Trash2 className="h-4.5 w-4.5 text-red-500" />
                <span>Confirm Deletion</span>
              </h3>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-300">
              Are you absolutely sure you want to permanently delete user <strong className="text-white">"{userToDelete.fullName}"</strong> and remove their notes metadata from global registries?
            </p>
            
            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4.5 py-2.5 rounded-xl border border-[#49454F]/50 text-xs font-bold uppercase hover:bg-white/5 transition text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 bg-red-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl hover:bg-red-500 transition cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC COMPONENT MODAL: EDIT USER FIELD MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#1D1B20] border border-[#49454F]/50 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-[#49454F]/30 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-[#D0BCFF]" />
                <span>Adjust accounts catalog record</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-sans">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Profile Display Title:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">System Email Destination:</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">Password Key Entry:</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121214] border border-[#49454F]/40 focus:outline-none focus:border-[#D0BCFF] text-xs text-white rounded-xl font-mono"
                />
              </div>

              {/* Edit authority attributes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block">User System Authority:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole("user")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      editRole === "user"
                        ? "bg-[#D0BCFF]/15 border-[#D0BCFF] text-[#D0BCFF]"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    }`}
                  >
                    User role
                  </button>
                  <button
                    type="button"
                    disabled={editingUser.id === currentUser.id}
                    onClick={() => setEditRole("admin")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      editRole === "admin"
                        ? "bg-[#A1F000]/15 border-[#A1F000] text-[#A1F000]"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    } disabled:opacity-50`}
                    title={editingUser.id === currentUser.id ? "Cannot demote yourself using edit modal" : ""}
                  >
                    Admin role
                  </button>
                </div>
              </div>

              {/* Status active vs suspended */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[#938F99] font-bold block font-sans">Access Authorization status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("active")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      editStatus === "active"
                        ? "bg-emerald-950/15 border-[#A1F000] text-[#A1F000]"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    }`}
                  >
                    Active status
                  </button>
                  <button
                    type="button"
                    disabled={editingUser.id === currentUser.id}
                    onClick={() => setEditStatus("suspended")}
                    className={`py-2 text-xs rounded-xl font-bold border transition text-center cursor-pointer ${
                      editStatus === "suspended"
                        ? "bg-red-950/20 border-red-500 text-red-400"
                        : "bg-[#121214] border-[#49454F]/35 text-zinc-400"
                    } disabled:opacity-50`}
                    title={editingUser.id === currentUser.id ? "Cannot suspend yourself" : ""}
                  >
                    Suspended
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4.5 py-2.5 rounded-xl border border-[#49454F]/50 text-xs font-bold uppercase hover:bg-white/5 transition text-[#CAC4D0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#A1F000] text-black font-extrabold text-xs uppercase tracking-wide rounded-xl hover:bg-[#b0ff1a] transition cursor-pointer"
                >
                  Confirm Updates
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
