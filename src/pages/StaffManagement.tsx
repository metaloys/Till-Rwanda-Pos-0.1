import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { UserRole, Profile } from '../appTypes.ts'; 
import { Users, AlertTriangle, Loader2 } from 'lucide-react';

// Options for the roles we defined
const ROLE_OPTIONS: UserRole[] = ['cashier', 'manager', 'owner'];

interface StaffManagementProps {
    userRole: UserRole; 
}

export default function StaffManagement({ userRole }: StaffManagementProps) {
    const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Fetch all profiles excluding the current user
    async function fetchStaffProfiles() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch all profiles that are NOT the current user
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id) // Exclude the currently logged-in user
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching staff profiles:', error.message);
            alert(error.message);
        } else if (data) {
            setStaffProfiles(data as Profile[]);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchStaffProfiles();
    }, []);

    // Function to handle role update
    const handleRoleChange = async (profile: Profile, newRole: UserRole) => {
        if (!confirm(`Are you sure you want to change ${profile.full_name}'s role to ${newRole.toUpperCase()}?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            // Update the role in the database
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profile.id);

            if (error) throw new Error(error.message);

            alert(`Role for ${profile.full_name} updated to ${newRole.toUpperCase()}.`);
            fetchStaffProfiles(); // Refresh the list
        } catch (error: any) {
            alert(`Failed to update role: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Owner is the only role that should see this entire page for security
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
        <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="flex items-center text-lg font-semibold text-gray-900">
                <Users className="mr-2 h-5 w-5" /> Staff Management
            </h2>
            <p className="mt-2 mb-6 text-sm text-gray-600">
                Manage existing staff roles and access. Use Supabase Console to invite new users.
            </p>
            
            <div className="mt-4 flow-root">
                {loading ? (
                    <p className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="th-style">Staff Name</th>
                                <th className="th-style">Joined</th>
                                <th className="th-style">Current Role</th>
                                <th className="th-style">Change Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {staffProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="td-style text-center text-gray-500">No other staff members found.</td>
                                </tr>
                            ) : (
                                staffProfiles.map((profile) => (
                                    <tr key={profile.id}>
                                        <td className="td-style font-medium text-gray-900">{profile.full_name || profile.id}</td>
                                        <td className="td-style text-sm text-gray-500">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={`td-style font-semibold capitalize ${
                                            profile.role === 'owner' ? 'text-purple-600' :
                                            profile.role === 'manager' ? 'text-indigo-600' :
                                            'text-blue-600'
                                        }`}>
                                            {profile.role}
                                        </td>
                                        <td className="td-style">
                                            <select
                                                value={profile.role}
                                                onChange={(e) => handleRoleChange(profile, e.target.value as UserRole)}
                                                disabled={isProcessing || profile.role === 'owner'} // Owner cannot change own role or another owner's role easily
                                                className="input-field py-1 text-sm disabled:bg-gray-100 disabled:opacity-80 disabled:cursor-not-allowed"
                                            >
                                                {ROLE_OPTIONS.map((role) => (
                                                    // Prevent changing the role of another owner for security
                                                    <option key={role} value={role} disabled={profile.role === 'owner' && role !== 'owner'}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </option>
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