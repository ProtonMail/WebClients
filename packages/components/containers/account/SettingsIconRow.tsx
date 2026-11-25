import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './SettingsIconRow.scss';

interface SettingsIconRowProps {
    /**
     * Shown in the 24px column before the content, centered and hidden from screen readers.
     * Icons look best at `size={6}` in weak color: `<IcBell size={6} className="color-weak" />`.
     * Product logos use `size={6}` too: `<Logo appName={appName} variant="glyph-only" size={6} />`.
     */
    icon?: ReactNode;
    centered?: boolean;
    children: ReactNode;
    className?: string;
}

const SettingsIconRow = ({ icon, centered = true, children, className }: SettingsIconRowProps) => {
    return (
        <div className={clsx('settings-icon-row w-full grid gap-3', centered && 'items-center', className)}>
            <span className="flex justify-center" aria-hidden="true">
                {icon}
            </span>
            {children}
        </div>
    );
};

export { SettingsIconRow };
