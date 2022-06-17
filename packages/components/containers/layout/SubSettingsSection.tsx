import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SettingsSectionTitle } from '../account';
import { Icon } from '../../components';
import { classnames } from '../../helpers';

export interface SubSettingsSectionProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    children: ReactNode;
}

const SubSettingsSection = ({ id, observer, title, children, className, ...rest }: SubSettingsSectionProps) => {
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
            <section
                {...rest}
                id={id}
                ref={ref}
                data-target-id={id}
                className={classnames([className, 'sub-settings-section'])}
            >
                {title && (
                    <Link to={`#${id}`} className="sub-settings-section-link">
                        <SettingsSectionTitle className="opacity-on-hover-container relative">
                            <span
                                className="sub-settings-section-anchor absolute opacity-on-hover"
                                aria-hidden="true"
                                tabIndex={-1}
                            >
                                <Icon name="link" />
                            </span>
                            {title}
                        </SettingsSectionTitle>
                    </Link>
                )}
                {children}
            </section>
        </>
    );
};

export default SubSettingsSection;
