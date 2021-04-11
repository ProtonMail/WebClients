import React, { useEffect, useRef } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import ErrorBoundary from '../../containers/app/ErrorBoundary';
import SettingsPageTitle from '../../containers/account/SettingsPageTitle';
import useAppTitle from '../../hooks/useAppTitle';
import SubSettingsSection from './SubSettingsSection';
import PrivateMainArea from './PrivateMainArea';
import { SubSectionConfig, SettingsPropsShared } from './interface';
import useActiveSection from './useActiveSection';

import createScrollIntoView from '../../helpers/createScrollIntoView';
import { classnames } from '../../helpers';
import { SettingsParagraph } from '../../containers';

interface Props extends SettingsPropsShared {
    title: string;
    children: React.ReactNode;
    subsections: SubSectionConfig[];
    description?: string;
}

const PrivateMainSettingsArea = ({ setActiveSection, location, title, children, description, subsections }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const useIntersectionSection = useRef(false);

    useAppTitle(title);

    useEffect(() => {
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

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
        setActiveSection?.(hash.slice(1));

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
    const observer = useActiveSection(useIntersectionSection.current && setActiveSection ? setActiveSection : noop);

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
        <PrivateMainArea ref={mainAreaRef}>
            <div className="container-section-sticky">
                <SettingsPageTitle className={classnames(['mt1-5', !description && 'mb1-5'])}>
                    {title}
                </SettingsPageTitle>
                {description && <SettingsParagraph className="mb1-5">{description}</SettingsParagraph>}
                <ErrorBoundary>{wrappedSections}</ErrorBoundary>
            </div>
        </PrivateMainArea>
    );
};

export default PrivateMainSettingsArea;
