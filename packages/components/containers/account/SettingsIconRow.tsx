import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

import './SettingsIconRow.scss';

interface SettingsIconRowProps {
    icon?: IconComponent;
    centered?: boolean;
    children: ReactNode;
    className?: string;
}

const SettingsIconRow = ({ icon: Icon, centered = true, children, className }: SettingsIconRowProps) => {
    return (
        <div className={clsx('settings-icon-row w-full grid gap-3', centered && 'items-center', className)}>
            {Icon ? <Icon className="settings-icon-row-icon shrink-0 color-weak" size={6} /> : <span aria-hidden />}
            {children}
        </div>
    );
};

export { SettingsIconRow };
