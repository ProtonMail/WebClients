import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import useScrollIntoView from '@proton/hooks/useScrollIntoView';
import { IcLink } from '@proton/icons/icons/IcLink';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import ProtonBadge from '../../components/protonBadge/ProtonBadge';
import useNotifications from '../../hooks/useNotifications';
import SettingsSectionTitle from '../account/SettingsSectionTitle';
import { SettingsLayoutVariant } from './interface';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    title?: string;
    invisibleTitle?: boolean;
    beta?: boolean;
    children: ReactNode;
    variant?: SettingsLayoutVariant;
}

const SubSettingsSection = ({
    id,
    title,
    invisibleTitle,
    beta,
    children,
    className,
    variant = SettingsLayoutVariant.Default,
    ...rest
}: SubSettingsSectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();
    const location = useLocation();

    useScrollIntoView(ref, location.hash === `#${id}`, location.key);

    const handleLinkClick = () => {
        const hash = document.location.hash;
        const dehashedHref = document.location.href.replace(hash, '');

        const urlToCopy = `${dehashedHref}#${id}`;
        textToClipboard(urlToCopy);

        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    };

    const linkElement = (
        <Link
            to={`#${id}`}
            onClick={handleLinkClick}
            className="sub-settings-section-anchor absolute group-hover:opacity-100"
            aria-hidden="true"
            tabIndex={-1}
        >
            <IcLink />
        </Link>
    );

    // Prefix ids with section- to avoid collision, for example #password or
    // #username for inputs in other context. Note: the id is not used to
    // scroll into the anchor. This is done programmatically with
    // scrollIntoView. This id is just as a helper to be used for css.
    const sectionId = `section-${id}`;

    if (variant === 'card') {
        return (
            <section
                {...rest}
                id={sectionId}
                ref={ref}
                data-target-id={id}
                className={clsx([className, 'sub-settings-section'])}
            >
                <div className="group-hover-opacity-container relative">
                    {linkElement}
                    <DashboardGrid as="div">
                        {title && !invisibleTitle && <DashboardGridSectionHeader title={title} />}
                        <DashboardCard>
                            <DashboardCardContent>{children}</DashboardCardContent>
                        </DashboardCard>
                    </DashboardGrid>
                </div>
            </section>
        );
    }

    return (
        <section
            {...rest}
            id={sectionId}
            ref={ref}
            data-target-id={id}
            className={clsx([className, 'sub-settings-section'])}
        >
            {title && !invisibleTitle && (
                <SettingsSectionTitle className="group-hover-opacity-container relative">
                    {linkElement}
                    <span className={clsx(invisibleTitle && 'sr-only')}>{title}</span>
                    {beta && (
                        <ProtonBadge
                            className="align-middle"
                            text={c('Info').t`Beta`}
                            tooltipText={c('Tooltip').t`Feature in early access`}
                        />
                    )}
                </SettingsSectionTitle>
            )}

            {title && invisibleTitle ? (
                <div className="group-hover-opacity-container relative">
                    {linkElement}
                    {children}
                </div>
            ) : (
                children
            )}
        </section>
    );
};

export default SubSettingsSection;
