import React, { useEffect, useRef } from 'react';
import { SubTitle } from '../../index';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
    className?: string;
    observer?: IntersectionObserver;
    title: string;
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
                <SubTitle>{title}</SubTitle>
                {children}
            </section>
        </>
    );
};

export default SubSettingsSection;
