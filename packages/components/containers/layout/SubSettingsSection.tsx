import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { DashboardCard, DashboardCardContent, DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import ProtonBadge from '@proton/components/components/protonBadge/ProtonBadge';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    invisibleTitle?: boolean;
    beta?: boolean;
    children: ReactNode;
    variant?: 'default' | 'card';
}

const SubSettingsSection = ({
    id,
    observer,
    title,
    invisibleTitle,
    beta,
    children,
    className,
    variant = 'default',
    ...rest
}: SubSettingsSectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();
    const location = useLocation();

    useEffect(() => {
        if (location.hash === `#${id}`) {
            ref.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!observer || !el) {
            return;
        }
        observer.observe(el);
        return () => {
            observer.unobserve(el);
        };
    }, [observer, ref.current]);

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
            <Icon name="link" />
        </Link>
    );

    if (variant === 'card') {
        return (
            <>
                <div className="relative">
                    <div id={id} className="header-height-anchor" />
                </div>
                <section
                    {...rest}
                    id={id}
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
            </>
        );
    }

    return (
        <>
            <div className="relative">
                <div id={id} className="header-height-anchor" />
            </div>
            <section
                {...rest}
                id={id}
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
        </>
    );
};

export default SubSettingsSection;
