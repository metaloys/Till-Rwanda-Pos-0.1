import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { UserRole, Profile } from '../appTypes.ts';
import { Users, AlertTriangle, Mail, Shield, Calendar, Trash2, UserCheck, UserX } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

const ROLE_OPTIONS: UserRole[] = ['cashier', 'manager'];

interface StaffManagementProps {
  userRole: UserRole;
  profile: Profile;
}

type ConfirmAction = {
  action: 'deactivate' | 'reactivate' | 'delete';
  profile: Profile;
} | null;

export default function StaffManagement({ userRole, profile }: StaffManagementProps) {
  const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('cashier');
  const [confirmState, setConfirmState] = useState<ConfirmAction>(null);

  async function fetchStaffProfiles() { if (!profile.shop_id) { setLoading(false); return; } setLoading(true); const { data, error } = await supabase.from('profiles').select('*').eq('shop_id', profile.shop_id).neq('id', profile.id).order('full_name', { ascending: true }); if (error) { console.error('Error fetching staff:', error.message); toast.error(error.message); } else if (data) { setStaffProfiles(data as Profile[]); } setLoading(false); }
  useEffect(() => { if(profile.shop_id) fetchStaffProfiles(); }, [profile.shop_id]);

  const handleRoleChange = async (targetProfile: Profile, newRole: UserRole) => { 
    setIsProcessing(true); 
    // --- FIX: This is now a real Promise ---
    const rolePromise = (async () => {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetProfile.id);
      if (error) throw error;
    })();
    // --- END FIX ---
    
    toast.promise(rolePromise, {
        loading: 'Updating role...',
        success: () => { fetchStaffProfiles(); setIsProcessing(false); return 'Role updated.'; },
        error: (err) => { setIsProcessing(false); return `Failed: ${err.message}`; }
    });
  };
  
  const handleInviteStaff = async (e: FormEvent) => { 
    e.preventDefault(); if (!profile.shop_id) return toast.error("Shop ID not found."); 
    setIsProcessing(true); 
    
    // This is already a promise, so it's fine
    const invitePromise = supabase.functions.invoke('invite-staff', { body: JSON.stringify({ email: inviteEmail, role: inviteRole, shopId: profile.shop_id, ownerName: profile.full_name || 'Owner', }), headers: { 'Content-Type': 'application/json' }, });
    
    toast.promise(invitePromise, {
        loading: 'Sending invitation...',
        success: (response: any) => {
            if (response.data.error) throw new Error(response.data.error);
            setInviteEmail(''); 
            fetchStaffProfiles();
            setIsProcessing(false);
            return 'Invitation sent!';
        },
        error: (err) => {
            setIsProcessing(false);
            return `Invitation failed: ${err.message}`;
        }
    });
  };

  const handleToggleActive = (targetProfile: Profile, activate: boolean) => {
    setConfirmState({ action: activate ? 'reactivate' : 'deactivate', profile: targetProfile });
  };
  
  const handleDeleteStaff = (staffProfile: Profile) => {
    setConfirmState({ action: 'delete', profile: staffProfile });
  };

  const onConfirmAction = async () => {
    if (!confirmState) return;
    const { action, profile: targetProfile } = confirmState;
    let promise: Promise<any>;
    let loadingMessage = 'Processing...';
    let successMessage = 'Action completed.';

    if (action === 'delete') {
        loadingMessage = `Deleting ${targetProfile.full_name}...`;
        successMessage = `User ${targetProfile.full_name} has been deleted.`;
        promise = supabase.functions.invoke('delete-staff', { body: JSON.stringify({ userIdToDelete: targetProfile.id }), headers: { 'Content-Type': 'application/json' } });
    } else {
        const activate = action === 'reactivate';
        loadingMessage = `${activate ? 'Reactivating' : 'Deactivating'} ${targetProfile.full_name}...`;
        successMessage = `${targetProfile.full_name} has been ${activate ? 'reactivated' : 'deactivated'}.`;
        promise = supabase.functions.invoke('toggle-staff-status', { body: JSON.stringify({ userId: targetProfile.id, activate: activate }), headers: { 'Content-Type': 'application/json' } });
    }

    setIsProcessing(true);
    toast.promise(promise, {
        loading: loadingMessage,
        success: (response: any) => {
            if (response.data && response.data.error) throw new Error(response.data.error);
            fetchStaffProfiles(); setIsProcessing(false); setConfirmState(null);
            return successMessage;
        },
        error: (err) => {
            setIsProcessing(false); setConfirmState(null);
            return `Failed: ${err.message}`;
        }
    });
  };

  if (userRole !== 'owner') { return ( <div className="rounded-lg bg-red-100 dark:bg-red-900/50 p-6 text-center text-red-800 dark:text-red-300 shadow-lg"><AlertTriangle className="mx-auto mb-3 h-10 w-10" /><h2 className="text-xl font-bold">Access Denied</h2><p className="mt-2">Only the **Owner** can manage staff.</p></div> ); }
  
  return ( 
    <>
      <div className="rounded-lg bg-white dark:bg-slate-800 p-4 md:p-6 shadow-lg space-y-6">
        <h2 className="card-header flex items-center border-b border-slate-200 dark:border-slate-700 pb-3"><Users className="mr-2 h-5 w-5" /> Staff Management: {profile.shop_name || 'N/A'}</h2>
        <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-slate-700/50">
          <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800 dark:text-blue-300"><Mail className="h-5 w-5 mr-2" /> Invite New Staff</h3>
          <form onSubmit={handleInviteStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2"><label htmlFor="invite-email" className="label-style">Email Address</label><input id="invite-email" type="email" required className="input-field" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={isProcessing} placeholder="cashier@example.com" /></div>
            <div><label htmlFor="invite-role" className="label-style">Assign Role</label><select id="invite-role" required className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} disabled={isProcessing}>{ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}</select></div>
            <button type="submit" disabled={isProcessing || !inviteEmail} className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{isProcessing ? 'Sending...' : 'Send Invitation'}</button>
          </form>
        </div>
        <div>
          <h3 className="card-header mb-3">Current Staff List ({staffProfiles.length})</h3>
          {loading ? ( <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading staff...</p> ) : (
            <>
              <div className="mt-4 hidden md:block flow-root overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"><thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="th-style">Name / Email</th><th className="th-style">Member Since</th><th className="th-style">Current Role</th><th className="th-style">Status</th><th className="th-style">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {staffProfiles.length === 0 ? (<tr><td colSpan={5} className="td-style text-center text-slate-500 dark:text-slate-400">No other staff members found.</td></tr>) : (
                    staffProfiles.map((staffProfile) => (<tr key={staffProfile.id}><td className="td-style font-medium text-slate-900 dark:text-white">{staffProfile.full_name || staffProfile.id}<p className="text-xs text-slate-500 dark:text-slate-400">{staffProfile.id}</p></td><td className="td-style text-sm text-slate-500 dark:text-slate-400">{new Date(staffProfile.created_at).toLocaleDateString()}</td><td className={`td-style font-semibold capitalize ${staffProfile.role === 'manager' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}`}>{staffProfile.role}</td><td className="td-style">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${staffProfile.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{staffProfile.status.toUpperCase()}</span>
                    </td><td className="td-style space-x-2 whitespace-nowrap">
                      <select value={staffProfile.role} onChange={(e) => handleRoleChange(staffProfile, e.target.value as UserRole)} disabled={isProcessing || staffProfile.role === 'owner'} className="input-field py-1 text-sm w-32 inline-block disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-80">
                        {ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}
                      </select>
                      {staffProfile.status === 'active' ? (
                          <button onClick={() => handleToggleActive(staffProfile, false)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 disabled:opacity-50"><UserX className="h-4 w-4" /></button>
                      ) : (
                           <button onClick={() => handleToggleActive(staffProfile, true)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 disabled:opacity-50"><UserCheck className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDeleteStaff(staffProfile)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4" /></button>
                    </td></tr>
                  )))}
                </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-4 md:hidden">
                {staffProfiles.length === 0 ? (<p className="py-10 text-center text-slate-500 dark:text-slate-400">No other staff members found.</p>) : (
                  staffProfiles.map((staffProfile) => (
                    <div key={staffProfile.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                      <div className="flex items-center justify-between"><div className="font-bold text-slate-900 dark:text-white">{staffProfile.full_name || staffProfile.id}</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${staffProfile.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{staffProfile.status.toUpperCase()}</span></div>
                      <div className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Joined: {new Date(staffProfile.created_at).toLocaleDateString()}</div>
                        <div className={`flex items-center font-medium capitalize ${staffProfile.role === 'manager' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}`}><Shield className="mr-2 h-4 w-4" /> Role: {staffProfile.role}</div>
                      </div>
                      <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <label htmlFor={`role-${staffProfile.id}`} className="label-style text-xs">Change Role:</label>
                        <select id={`role-${staffProfile.id}`} value={staffProfile.role} onChange={(e) => handleRoleChange(staffProfile, e.target.value as UserRole)} disabled={isProcessing || staffProfile.role === 'owner'} className="input-field py-2 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:opacity-80">
                          {ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}
                        </select>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                        {staffProfile.status === 'active' ? (
                            <button onClick={() => handleToggleActive(staffProfile, false)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button justify-center bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 disabled:opacity-50"><UserX className="mr-1.5 h-4 w-4" /> Deactivate</button>
                        ) : (
                            <button onClick={() => handleToggleActive(staffProfile, true)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button justify-center bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 disabled:opacity-50"><UserCheck className="mr-1.5 h-4 w-4" /> Reactivate</button>
                        )}
                        <button onClick={() => handleDeleteStaff(staffProfile)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button justify-center bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"><Trash2 className="mr-1.5 h-4 w-4" /> Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={onConfirmAction}
        isProcessing={isProcessing}
        title={
          confirmState?.action === 'delete' ? 'Delete Staff Member?' : 
          confirmState?.action === 'deactivate' ? 'Deactivate Staff Member?' : 'Reactivate Staff Member?'
        }
        confirmText={
          confirmState?.action === 'delete' ? 'Delete' : 
          confirmState?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'
        }
        confirmColor={
          confirmState?.action === 'reactivate' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }
      >
        <p className="dark:text-slate-300">Are you sure you want to {confirmState?.action} <span className="font-bold">{confirmState?.profile?.full_name}</span>?</p>
        {confirmState?.action === 'delete' && <p className="mt-2 text-sm text-red-600 dark:text-red-400">This action is permanent and cannot be undone.</p>}
        {confirmState?.action === 'deactivate' && <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">This will immediately log them out of all devices.</p>}
      </ConfirmModal>
    </>
  );
}