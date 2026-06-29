import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import './SidebarUpsellSection.scss';

interface SidebarUpsellSectionProps {
    title: ReactNode;
    description: ReactNode;
    children?: ReactNode;
    className?: string;
}

export const SidebarUpsellSection = ({ title, description, children, className }: SidebarUpsellSectionProps) => {
    return (
        <div className={clsx('sidebar-upsell-section rounded-xl ml-0 mb-0 mx-auto overflow-y-auto', className)}>
            <div className="rounded-sm flex flex-column flex-nowrap gap-3 p-4">
                <h4 className="text-rg text-semibold m-0">{title}</h4>
                <p className="m-0 color-weak shrink-0 text-sm">{description}</p>
                {children}
            </div>
        </div>
    );
};
