import { type ReactNode, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
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

    const isTouchDevice = useIsTouchDevice();
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
                'sidebar-upsell-section group-hover-opacity-container relative mx-auto mb-0 ml-0 border lumo-border radius-12',
                className
            )}
        >
            <Button
                icon
                shape="ghost"
                className={clsx(
                    'sidebar-upsell-section-dismiss-button absolute top-0 right-0 shrink-0 self-start radius-8',
                    !isTouchDevice && 'group-hover:opacity-100'
                )}
                onClick={handleDismiss}
                title={c('Action').t`Dismiss`}
            >
                <LumoIcon
                    name="X"
                    width={16}
                    height={16}
                    className="lumo-color-glyph"
                    aria-label={c('Action').t`Dismiss`}
                />
            </Button>
            <div className="sidebar-upsell-section-body flex flex-column flex-nowrap p-4">
                <h4 className="sidebar-upsell-section-title m-0 pr-8 lumo-body-large">{title}</h4>
                <p className="shrink-0 m-0 lumo-body-small lumo-color-glyph-mid">{description}</p>
                {children}
            </div>
        </div>
    );
};
