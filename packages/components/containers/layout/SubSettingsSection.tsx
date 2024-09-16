import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import ProtonBadge from '@proton/components/components/protonBadge/ProtonBadge';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { useNotifications } from '../../hooks';
import { SettingsSectionTitle } from '../account';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    beta?: boolean;
    children: ReactNode;
}

const SubSettingsSection = ({ id, observer, title, beta, children, className, ...rest }: SubSettingsSectionProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();

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
                {title && (
                    <SettingsSectionTitle className="group-hover-opacity-container relative">
                        <Link
                            to={`#${id}`}
                            onClick={handleLinkClick}
                            className="sub-settings-section-anchor absolute group-hover:opacity-100"
                            aria-hidden="true"
                            tabIndex={-1}
                        >
                            <Icon name="link" />
                        </Link>
                        {title}
                        {beta && (
                            <ProtonBadge
                                className="align-middle"
                                text={c('Info').t`Beta`}
                                tooltipText={c('Tooltip').t`Feature in early access`}
                            />
                        )}
                    </SettingsSectionTitle>
                )}
                {children}
            </section>
        </>
    );
};

export default SubSettingsSection;
