import React from "react";
import { Navigate } from "react-router-dom";
import usePermission from "../hooks/usePermission";

const PermissionRoute = ({ children, permission, requireAll = false }) => {
    const { can } = usePermission();

    if (!permission) {
        return children;
    }

    let hasPermission = false;

    if (Array.isArray(permission)) {
        if (requireAll) {
            hasPermission = permission.every((p) => can(p));
        } else {
            hasPermission = permission.some((p) => can(p));
        }
    } else {
        hasPermission = can(permission);
    }

    if (!hasPermission) {
        console.warn(`🚫 Access denied. Required: ${JSON.stringify(permission)}. User has permissions? ${can('any_permission')}`);
        // Redirect to dashboard if access is denied
        // If we are already at dashboard (or trying to go there) and denied, 
        // we might want to show a 403 page or just render nothing/alert.
        // But for now, redirecting to dashboard is the standard behavior 
        // (though it causes the loop if dashboard itself denies access).
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PermissionRoute;
