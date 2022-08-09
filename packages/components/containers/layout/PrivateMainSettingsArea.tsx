import { Children, ReactNode, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import noop from '@proton/utils/noop';

import { classnames } from '../../helpers';
import createScrollIntoView from '../../helpers/createScrollIntoView';
import useAppTitle from '../../hooks/useAppTitle';
import { SettingsPageTitle, SettingsParagraph } from '../account';
import ErrorBoundary from '../app/ErrorBoundary';
import PrivateMainArea from './PrivateMainArea';
import SubSettingsSection from './SubSettingsSection';
import { getIsSubsectionAvailable } from './helper';
import { SettingsAreaConfig } from './interface';
import useActiveSection from './useActiveSection';

interface PrivateMainSettingsAreaBaseProps {
    breadcrumbs?: ReactNode;
    title: string;
    noTitle?: boolean;
    description?: string;
    setActiveSection?: (section: string) => void;
    children?: ReactNode;
}

export const PrivateMainSettingsAreaBase = ({
    breadcrumbs,
    title,
    noTitle,
    description,
    setActiveSection,
    children,
}: PrivateMainSettingsAreaBaseProps) => {
    const location = useLocation();

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
    const sectionObserver = useActiveSection(
        useIntersectionSection.current && setActiveSection ? setActiveSection : noop
    );

    const wrappedSections = Children.toArray(children).map((child) => {
        if (!isValidElement<{ observer: IntersectionObserver; className: string }>(child)) {
            return null;
        }

        return cloneElement(child, {
            observer: sectionObserver,
        });
    });

    return (
        <PrivateMainArea ref={mainAreaRef}>
            <div className="container-section-sticky">
                {breadcrumbs && <div className="on-mobile-mt1-5">{breadcrumbs}</div>}
                {!noTitle && (
                    <SettingsPageTitle className={classnames(['mt1-5', !description && 'mb1-5'])}>
                        {title}
                    </SettingsPageTitle>
                )}
                {description && <SettingsParagraph className="mb1-5">{description}</SettingsParagraph>}
                <ErrorBoundary>{wrappedSections}</ErrorBoundary>
            </div>
        </PrivateMainArea>
    );
};

interface PrivateMainSettingsAreaProps {
    children: ReactNode;
    setActiveSection?: (section: string) => void;
    config: SettingsAreaConfig;
}

const PrivateMainSettingsArea = ({ setActiveSection, children, config }: PrivateMainSettingsAreaProps) => {
    const { text, title, description, subsections } = config;

    const wrappedSections = Children.toArray(children).map((child, i) => {
        if (!isValidElement<{ observer: IntersectionObserver; className: string }>(child)) {
            return null;
        }
        const subsectionConfig = subsections?.[i];
        if (!subsectionConfig) {
            throw new Error('Missing subsection');
        }
        if (!getIsSubsectionAvailable(subsectionConfig)) {
            return null;
        }

        return (
            <SubSettingsSection
                key={subsectionConfig.id}
                id={subsectionConfig.id}
                title={subsectionConfig.text}
                className="container-section-sticky-section"
            >
                {child}
            </SubSettingsSection>
        );
    });

    return (
        <PrivateMainSettingsAreaBase
            title={title || text}
            description={description}
            setActiveSection={setActiveSection}
        >
            {wrappedSections}
        </PrivateMainSettingsAreaBase>
    );
};

export default PrivateMainSettingsArea;
