import type { ReactNode } from 'react';

interface NavItemStatusProps {
    children: ReactNode;
}

/**
 * Lays out the status content of a recovery `SettingsNavItem`, typically a
 * `StatusBadge` followed by a `LastChanged`.
 */
export const NavItemStatus = ({ children }: NavItemStatusProps) => {
    return (
        <span className="flex gap-3" style={{ alignItems: 'last baseline' }}>
            {children}
        </span>
    );
};
