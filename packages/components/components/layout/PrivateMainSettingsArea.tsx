import React, { useEffect, useRef, useState } from 'react';
import {
    SettingsTitle,
    ErrorBoundary,
    PrivateMainArea,
    SubSettingsSection,
    SubSectionConfig,
    useAppTitle,
} from '../../index';
import { SettingsPropsShared } from './interface';
import useActiveSection from './useActiveSection';

interface Props extends SettingsPropsShared {
    title: string;
    appName: string;
    children: React.ReactNode;
    subsections: SubSectionConfig[];
}

const PrivateMainSettingsArea = ({ setActiveSection, location, title, children, appName, subsections }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState<number>(0);

    useAppTitle(title, appName);

    useEffect(() => {
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    useEffect(() => {
        const { hash } = location;
        if (!hash) {
            return;
        }

        // Need a delay to let the navigation end
        const handle = setTimeout(() => {
            const el = mainAreaRef.current?.querySelector(hash);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);

        return () => clearTimeout(handle);
    }, [location.hash]);

    const observer = useActiveSection(setActiveSection);

    const wrappedSections = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, index) => {
            const subsectionConfig = subsections[index];
            if (!subsectionConfig) {
                return child;
            }
            const { id, text } = subsectionConfig;
            return (
                <SubSettingsSection
                    key={id}
                    className="container-section-sticky-section"
                    title={text}
                    id={id}
                    observer={observer}
                >
                    {child}
                </SubSettingsSection>
            );
        });

    return (
        <PrivateMainArea ref={mainAreaRef} onScroll={handleScroll}>
            <SettingsTitle onTop={!scrollTop}>{title}</SettingsTitle>
            <div className="container-section-sticky">
                <ErrorBoundary>{wrappedSections}</ErrorBoundary>
            </div>
        </PrivateMainArea>
    );
};

export default PrivateMainSettingsArea;
