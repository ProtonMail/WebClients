import { useEffect, useRef } from 'react';
import * as React from 'react';
import { SettingsSectionTitle } from '../../containers';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title?: string;
    children: React.ReactNode;
}

const SubSettingsSection = ({ id, observer, title, children, ...rest }: Props) => {
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
            <section {...rest} ref={ref} data-target-id={id}>
                {title && <SettingsSectionTitle>{title}</SettingsSectionTitle>}
                {children}
            </section>
        </>
    );
};

export default SubSettingsSection;
