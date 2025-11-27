import { useState, useEffect, useCallback } from 'react';

export const usePermission = () => {
    const [permissions, setPermissions] = useState(() => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr).permissions || [] : [];
        } catch {
            return [];
        }
    });
    const [roleId, setRoleId] = useState(() => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr).roleId : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const handleStorageChange = (e) => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setPermissions(user.permissions || []);
                    setRoleId(user.roleId);
                }
            } catch (error) {
                console.error("Error parsing user permissions", error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userUpdated', handleStorageChange);
        };
    }, []);

    const can = useCallback((permissionName) => {
        // Admin (roleId 1) has all permissions
        if (roleId === 1) return true;

        // Check if permission exists in user's permission list
        const hasIt = permissions.includes(permissionName);
        // console.log(`Checking permission: ${permissionName} -> ${hasIt}`); // Uncomment for verbose logging
        return hasIt;
    }, [roleId, permissions]);



    return { can, roleId, permissions };
};

export default usePermission;
