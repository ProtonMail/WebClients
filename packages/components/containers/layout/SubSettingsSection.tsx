import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SettingsSectionTitle } from '../account';
import { Icon } from '../../components';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    children: ReactNode;
}

const SubSettingsSection = ({ id, observer, title, children, ...rest }: SubSettingsSectionProps) => {
    const ref = useRef<HTMLDivElement>(null);

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

    return (
        <>
            <div className="relative">
                <div id={id} className="header-height-anchor" />
            </div>
            <section {...rest} id={id} ref={ref} data-target-id={id}>
                {title && (
                    <SettingsSectionTitle className="opacity-on-hover-container relative">
                        <Link
                            to={`#${id}`}
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
