import { type ReactNode, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { isSidebarUpsellDismissed, persistSidebarUpsellDismissed } from '../../../util/sidebarUpsellStorage';

import './SidebarUpsellSection.scss';

interface SidebarUpsellSectionProps {
    upsellId: string;
    title: ReactNode;
    description: ReactNode;
    children?: ReactNode;
    className?: string;
}

export const SidebarUpsellSection = ({
    upsellId,
    title,
    description,
    children,
    className,
}: SidebarUpsellSectionProps) => {
    const [isDismissed, setIsDismissed] = useState(() => {
        return isSidebarUpsellDismissed(upsellId);
    });

    const handleDismiss = () => {
        persistSidebarUpsellDismissed(upsellId);
        setIsDismissed(true);
    };

    if (isDismissed) {
        return children ?? null;
    }

    return (
        <div
            className={clsx(
                'sidebar-upsell-section rounded-xl ml-0 mb-0 mx-auto group-hover-opacity-container relative',
                className
            )}
        >
            <Button
                icon
                shape="ghost"
                className="sidebar-upsell-section-dismiss-button rounded-full border-weak shrink-0 self-start absolute top-0 right-0 bg-norm group-hover:opacity-100"
                onClick={handleDismiss}
                title={c('Action').t`Dismiss`}
            >
                <LumoIcon name="X" width={12} height={12} className="color-weak" aria-label={c('Action').t`Dismiss`} />
            </Button>
            <div className="rounded-sm flex flex-column flex-nowrap gap-3 p-4">
                <h4 className="text-rg text-semibold m-0">{title}</h4>
                <p className="m-0 color-weak shrink-0 text-sm">{description}</p>
                {children}
            </div>
        </div>
    );
};
