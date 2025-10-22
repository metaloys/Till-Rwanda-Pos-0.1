import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import type { UserRole, Profile } from '../appTypes.ts'; // MUST HAVE .ts extension
import { Users, AlertTriangle, Loader2, Mail, Edit } from 'lucide-react';

const ROLE_OPTIONS: UserRole[] = ['cashier', 'manager', 'owner'];

interface StaffManagementProps {
    userRole: UserRole; 
    profile: Profile; // The profile prop is now mandatory
}

export default function StaffManagement({ userRole, profile }: StaffManagementProps) {
    const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // States for the invitation form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('cashier');

    // Fetch all profiles belonging to the same shop, excluding the current user
    async function fetchStaffProfiles() {
        // Defensive check: Do not fetch if the shop ID is null
        if (!profile.shop_id) { 
            setLoading(false);
            return;
        }
        
        setLoading(true);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('shop_id', profile.shop_id) // Filter by the Owner's shop_id
            .neq('id', profile.id) // Exclude the current user
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching staff profiles:', error.message);
            alert(error.message);
        } else if (data) {
            setStaffProfiles(data as Profile[]);
        }
        setLoading(false);
    }

    // --- FIX 1: Add profile.shop_id to the dependency array ---
    // This tells React to re-run the fetch when the shop_id becomes available.
    useEffect(() => {
        fetchStaffProfiles();
    }, [profile.shop_id]); 
    // --- END FIX 1 ---

    // Function to handle role update (No functional change)
    const handleRoleChange = async (targetProfile: Profile, newRole: UserRole) => {
        if (!confirm(`Are you sure you want to change ${targetProfile.full_name}'s role to ${newRole.toUpperCase()}?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', targetProfile.id);

            if (error) throw new Error(error.message);

            alert(`Role for ${targetProfile.full_name} updated to ${newRole.toUpperCase()}.`);
            fetchStaffProfiles(); 
        } catch (error: any) {
            alert(`Failed to update role: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Function to handle Staff Invitation (No functional change)
    const handleInviteStaff = async (e: FormEvent) => {
        e.preventDefault();
        if (!profile.shop_id) return alert("Shop ID not found. Cannot invite.");

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
            
            alert(`Invitation sent to ${inviteEmail}. Role set to ${inviteRole.toUpperCase()}.`);
            setInviteEmail('');
            fetchStaffProfiles(); 

        } catch (error: any) {
            alert(`Invitation failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // --- RENDER ACCESS CHECK (No change) ---
    if (userRole !== 'owner') {
        return (
             <div className="rounded-lg bg-red-100 p-6 text-center text-red-800 shadow">
                 <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
                 <h2 className="text-xl font-bold">Access Denied</h2>
                 <p className="mt-2">Your current role ({userRole.toUpperCase()}) does not have permission to view this page. Only the **Owner** can manage staff.</p>
             </div>
        );
    }
    
    return (
        <div className="rounded-lg bg-white p-6 shadow space-y-6">
            <h2 className="flex items-center text-lg font-semibold text-gray-900 border-b pb-3">
                <Users className="mr-2 h-5 w-5" /> Staff Management for: {profile.shop_name || 'N/A'}
            </h2>
            
            {/* INVITATION FORM */}
            <div className="border border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800">
                    <Mail className="h-5 w-5 mr-2" /> Invite New Staff Member
                </h3>
                <form onSubmit={handleInviteStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="invite-email" className="label-style">Email Address</label>
                        <input id="invite-email" type="email" required className="input-field" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={isProcessing} placeholder="cashier@example.com" />
                    </div>
                    <div>
                        <label htmlFor="invite-role" className="label-style">Assign Role</label>
                         <select id="invite-role" required className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} disabled={isProcessing}>
                            {ROLE_OPTIONS.filter(role => role !== 'owner').map((role) => ( // Owner cannot invite another Owner easily
                                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={isProcessing || !inviteEmail} className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
                        {isProcessing ? 'Sending Invitation...' : 'Send Invitation'}
                    </button>
                </form>
            </div>


            {/* STAFF LIST (CRUD Read & Update) */}
            <div>
                <h3 className="font-semibold text-lg mb-3">Current Staff List ({staffProfiles.length})</h3>
                {loading ? (
                    <p className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="th-style">Name / Email</th>
                                <th className="th-style">Member Since</th>
                                <th className="th-style">Current Role</th>
                                <th className="th-style">Change Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {staffProfiles.length === 0 ? (
                                <tr><td colSpan={4} className="td-style text-center text-gray-500">No other staff members found.</td></tr>
                            ) : (
                                staffProfiles.map((staffProfile) => (
                                    <tr key={staffProfile.id}>
                                        <td className="td-style font-medium text-gray-900">
                                            {staffProfile.full_name || staffProfile.id}
                                            <p className="text-xs text-gray-500">{staffProfile.id}</p>
                                        </td>
                                        <td className="td-style text-sm text-gray-500">
                                            {new Date(staffProfile.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={`td-style font-semibold capitalize ${staffProfile.role === 'owner' ? 'text-purple-600' : staffProfile.role === 'manager' ? 'text-indigo-600' : 'text-blue-600'}`}>
                                            {staffProfile.role}
                                        </td>
                                        <td className="td-style">
                                            <select
                                                value={staffProfile.role}
                                                onChange={(e) => handleRoleChange(staffProfile, e.target.value as UserRole)}
                                                // Prevent Owner from changing their own role or another Owner's role
                                                disabled={isProcessing || staffProfile.role === 'owner' || userRole !== 'owner'}
                                                className="input-field py-1 text-sm disabled:bg-gray-100 disabled:opacity-80 disabled:cursor-not-allowed"
                                            >
                                                {ROLE_OPTIONS.filter(role => role !== 'owner').map((role) => (
                                                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}