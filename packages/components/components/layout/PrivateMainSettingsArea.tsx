import React, { useEffect, useRef, useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import ErrorBoundary from '../../containers/app/ErrorBoundary';
import useAppTitle from '../../hooks/useAppTitle';
import SettingsTitle from '../container/SettingsTitle';
import SubSettingsSection from './SubSettingsSection';
import PrivateMainArea from './PrivateMainArea';
import { SubSectionConfig, SettingsPropsShared } from './interface';
import useActiveSection from './useActiveSection';

import createScrollIntoView from '../../helpers/createScrollIntoView';

interface Props extends SettingsPropsShared {
    title: string;
    children: React.ReactNode;
    subsections: SubSectionConfig[];
}

const PrivateMainSettingsArea = ({ setActiveSection, location, title, children, subsections }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState<number>(0);
    const useIntersectionSection = useRef(false);

    useAppTitle(title);

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
            useIntersectionSection.current = true;
            return;
        }

        if (!mainAreaRef.current) {
            return;
        }
        const mainArea = mainAreaRef.current;
        const el = mainArea.querySelector(hash);
        if (!el) {
            return;
        }

        useIntersectionSection.current = false;
        setActiveSection(hash.slice(1));

        const abortScroll = createScrollIntoView(el, mainArea, true);
        let removeListeners: () => void;

        const abort = () => {
            useIntersectionSection.current = true;
            abortScroll();
            removeListeners?.();
        };

        const options = {
            passive: true,
            capture: true,
        };

        // Abort on any user interaction such as scrolling, touching, or keyboard interaction
        window.addEventListener('wheel', abort, options);
        window.addEventListener('keydown', abort, options);
        window.addEventListener('mousedown', abort, options);
        window.addEventListener('touchstart', abort, options);
        // Automatically abort after some time where it's assumed to have successfully scrolled into place.
        const timeoutId = window.setTimeout(abort, 15000);

        removeListeners = () => {
            window.removeEventListener('wheel', abort, options);
            window.removeEventListener('keydown', abort, options);
            window.removeEventListener('mousedown', abort, options);
            window.removeEventListener('touchstart', abort, options);
            window.clearTimeout(timeoutId);
        };

        return () => {
            abort();
        };
        // Listen to location instead of location.hash since it's possible to click the same #section multiple times and end up with a new entry in history
    }, [location]);

    // Don't always use the observer section observed value since it can not go to sections that are at the bottom or too small.
    // In those cases it can be overridden by clicking on a specific section
    const observer = useActiveSection(useIntersectionSection.current ? setActiveSection : noop);

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
