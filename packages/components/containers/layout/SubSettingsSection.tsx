import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { Icon } from '../../components';
import { classnames } from '../../helpers';
import { useNotifications } from '../../hooks';
import { SettingsSectionTitle } from '../account';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    children: ReactNode;
}

const SubSettingsSection = ({ id, observer, title, children, className, ...rest }: SubSettingsSectionProps) => {
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
                className={classnames([className, 'sub-settings-section'])}
            >
                {title && (
                    <SettingsSectionTitle className="opacity-on-hover-container relative">
                        <Link
                            to={`#${id}`}
                            onClick={handleLinkClick}
                            className="sub-settings-section-anchor absolute opacity-on-hover"
                            aria-hidden="true"
                            tabIndex={-1}
                        >
                            <Icon name="link" />
                        </Link>
                        {title}
                    </SettingsSectionTitle>
                )}
                {children}
            </section>
        </>
    );
};

export default SubSettingsSection;
