import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { UserRole, Profile } from '../appTypes.ts';
import { Users, AlertTriangle, Mail, Shield, Calendar, Trash2 } from 'lucide-react'; // FIX: Removed Loader2

const ROLE_OPTIONS: UserRole[] = ['cashier', 'manager'];

interface StaffManagementProps {
  userRole: UserRole;
  profile: Profile;
}

export default function StaffManagement({ userRole, profile }: StaffManagementProps) {
  const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('cashier');

  async function fetchStaffProfiles() { 
    if (!profile.shop_id) { setLoading(false); return; } 
    setLoading(true); 
    const { data, error } = await supabase.from('profiles').select('*').eq('shop_id', profile.shop_id).neq('id', profile.id).order('full_name', { ascending: true }); 
    if (error) { console.error('Error fetching staff:', error.message); alert(error.message); } 
    else if (data) { setStaffProfiles(data as Profile[]); } 
    setLoading(false); 
  }
  
  useEffect(() => { 
    if(profile.shop_id) fetchStaffProfiles(); 
  }, [profile.shop_id]);

  const handleRoleChange = async (targetProfile: Profile, newRole: UserRole) => { 
    if (!confirm(`Update ${targetProfile.full_name}'s role to ${newRole.toUpperCase()}?`)) { return; } 
    setIsProcessing(true); 
    try { 
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetProfile.id); 
      if (error) throw new Error(error.message); 
      alert(`Role updated.`); 
      fetchStaffProfiles(); 
    } catch (error: any) { 
      alert(`Failed: ${error.message}`); 
    } finally { 
      setIsProcessing(false); 
    } 
  };
  
  const handleInviteStaff = async (e: FormEvent) => { 
    e.preventDefault(); 
    if (!profile.shop_id) return alert("Shop ID not found."); 
    setIsProcessing(true); 
    try { 
      const { error } = await supabase.functions.invoke('invite-staff', { 
        body: JSON.stringify({ 
          email: inviteEmail, 
          role: inviteRole, 
          shopId: profile.shop_id, 
          ownerName: profile.full_name || 'Owner', 
        }), 
        headers: { 'Content-Type': 'application/json' }, 
      }); 
      if (error) throw new Error(error.message); 
      alert(`Invitation sent to ${inviteEmail}.`); 
      setInviteEmail(''); 
      fetchStaffProfiles(); 
    } catch (error: any) { 
      alert(`Invitation failed: ${error.message}`); 
    } finally { 
      setIsProcessing(false); 
    } 
  };

  const handleDeleteStaff = async (staffProfile: Profile) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE "${staffProfile.full_name}"?`)) { return; }
    setIsProcessing(true);
    try {
        const { error } = await supabase.functions.invoke('delete-staff', {
            body: JSON.stringify({ userIdToDelete: staffProfile.id }),
            headers: { 'Content-Type': 'application/json' },
        });
        if (error) throw new Error(error.message);
        alert(`User "${staffProfile.full_name}" has been deleted.`);
        fetchStaffProfiles(); 
    } catch (error: any) {
        alert(`Failed to delete user: ${error.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  if (userRole !== 'owner') { 
    return ( 
      <div className="rounded-lg bg-red-100 p-6 text-center text-red-800 shadow">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="mt-2">Only the **Owner** can manage staff.</p>
      </div> 
    ); 
  }
  
  return ( 
    <div className="rounded-lg bg-white p-4 md:p-6 shadow space-y-6">
      <h2 className="flex items-center text-lg font-semibold text-gray-900 border-b pb-3"><Users className="mr-2 h-5 w-5" /> Staff Management: {profile.shop_name || 'N/A'}</h2>
      <div className="border border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800"><Mail className="h-5 w-5 mr-2" /> Invite New Staff</h3>
        <form onSubmit={handleInviteStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2"><label htmlFor="invite-email" className="label-style">Email Address</label><input id="invite-email" type="email" required className="input-field" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={isProcessing} placeholder="cashier@example.com" /></div>
          <div><label htmlFor="invite-role" className="label-style">Assign Role</label><select id="invite-role" required className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} disabled={isProcessing}>{ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}</select></div>
          <button type="submit" disabled={isProcessing || !inviteEmail} className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">{isProcessing ? 'Sending...' : 'Send Invitation'}</button>
        </form>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-3">Current Staff List ({staffProfiles.length})</h3>
        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading staff...</p>
        ) : (
          <>
            <div className="mt-4 hidden md:block flow-root overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="th-style">Name / Email</th><th className="th-style">Member Since</th><th className="th-style">Current Role</th><th className="th-style">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {staffProfiles.length === 0 ? (<tr><td colSpan={4} className="td-style text-center text-gray-500">No other staff members found.</td></tr>) : (
                  staffProfiles.map((staffProfile) => (
                    <tr key={staffProfile.id}>
                      <td className="td-style font-medium text-gray-900">{staffProfile.full_name || staffProfile.id}<p className="text-xs text-gray-500">{staffProfile.id}</p></td>
                      <td className="td-style text-sm text-gray-500">{new Date(staffProfile.created_at).toLocaleDateString()}</td>
                      <td className={`td-style font-semibold capitalize ${staffProfile.role === 'owner' ? 'text-purple-600' : staffProfile.role === 'manager' ? 'text-indigo-600' : 'text-blue-600'}`}>{staffProfile.role}</td>
                      <td className="td-style space-x-2 whitespace-nowrap">
                        <select value={staffProfile.role} onChange={(e) => handleRoleChange(staffProfile, e.target.value as UserRole)} disabled={isProcessing || staffProfile.role === 'owner'} className="input-field py-1 text-sm w-32 inline-block disabled:bg-gray-100 disabled:opacity-80">
                          {ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}
                        </select>
                        <button onClick={() => handleDeleteStaff(staffProfile)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button bg-red-100 text-red-700 hover:bg-red-200 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-4 md:hidden">
              {staffProfiles.length === 0 ? (<p className="py-10 text-center text-gray-500">No other staff members found.</p>) : (
                staffProfiles.map((staffProfile) => (
                  <div key={staffProfile.id} className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="font-bold text-gray-900">{staffProfile.full_name || staffProfile.id}</div>
                    <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Joined: {new Date(staffProfile.created_at).toLocaleDateString()}</div>
                      <div className={`flex items-center font-medium capitalize ${staffProfile.role === 'owner' ? 'text-purple-600' : staffProfile.role === 'manager' ? 'text-indigo-600' : 'text-blue-600'}`}><Shield className="mr-2 h-4 w-4" /> Role: {staffProfile.role}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 border-t pt-3">
                      <div>
                        <label htmlFor={`role-${staffProfile.id}`} className="label-style text-xs">Change Role:</label>
                        <select id={`role-${staffProfile.id}`} value={staffProfile.role} onChange={(e) => handleRoleChange(staffProfile, e.target.value as UserRole)} disabled={isProcessing || staffProfile.role === 'owner'} className="input-field py-2 text-sm disabled:bg-gray-100 disabled:opacity-80">
                          {ROLE_OPTIONS.map((role) => ( <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option> ))}
                        </select>
                      </div>
                      <button onClick={() => handleDeleteStaff(staffProfile)} disabled={isProcessing || staffProfile.role === 'owner'} className="action-button justify-center bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50">
                        <Trash2 className="mr-1.5 h-4 w-4" /> Delete User
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div> 
  );
}