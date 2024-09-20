import type { ReactNode } from 'react';
import { Children, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import clsx from '@proton/utils/clsx';

import createScrollIntoView from '../../helpers/createScrollIntoView';
import useAppTitle from '../../hooks/useAppTitle';
import ErrorBoundary from '../app/ErrorBoundary';
import PrivateMainArea from './PrivateMainArea';
import SubSettingsSection from './SubSettingsSection';
import { getIsSubsectionAvailable } from './helper';
import type { SettingsAreaConfig } from './interface';

interface PrivateMainSettingsAreaBaseProps {
    breadcrumbs?: ReactNode;
    title?: string;
    noTitle?: boolean;
    description?: ReactNode;
    children?: ReactNode;
}

export const PrivateMainSettingsAreaBase = ({
    breadcrumbs,
    title,
    noTitle,
    description,
    children,
}: PrivateMainSettingsAreaBaseProps) => {
    const location = useLocation();

    const mainAreaRef = useRef<HTMLDivElement>(null);

    useAppTitle(title);

    useEffect(() => {
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    useEffect(() => {
        const { hash } = location;

        if (!hash) {
            return;
        }

        if (!mainAreaRef.current) {
            return;
        }
        const mainArea = mainAreaRef.current;
        let el: Element | null | undefined;
        try {
            el = mainArea.querySelector(hash);
        } catch (e) {}
        if (!el) {
            return;
        }

        const abortScroll = createScrollIntoView(el, mainArea, true);
        let removeListeners: () => void;

        const abort = () => {
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

    const wrappedSections = Children.toArray(children).map((child) => {
        if (!isValidElement<{ observer: IntersectionObserver; className: string }>(child)) {
            return null;
        }

        return cloneElement(child);
    });

    return (
        <PrivateMainArea ref={mainAreaRef}>
            <div className="container-section-sticky">
                {breadcrumbs && <div className="mt-6 md:mt-0">{breadcrumbs}</div>}
                {!noTitle && (
                    <SettingsPageTitle className={clsx('mt-14', description ? 'mb-5' : 'mb-14')}>
                        {title}
                    </SettingsPageTitle>
                )}
                {description && <SettingsParagraph className="mb-6">{description}</SettingsParagraph>}
                <ErrorBoundary>{wrappedSections}</ErrorBoundary>
            </div>
        </PrivateMainArea>
    );
};

interface PrivateMainSettingsAreaProps {
    children: ReactNode;
    config: SettingsAreaConfig;
}

const PrivateMainSettingsArea = ({ children, config }: PrivateMainSettingsAreaProps) => {
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
                beta={subsectionConfig.beta}
                className="container-section-sticky-section"
            >
                {child}
            </SubSettingsSection>
        );
    });

    return (
        <PrivateMainSettingsAreaBase title={title || text} description={description}>
            {wrappedSections}
        </PrivateMainSettingsAreaBase>
    );
};

export default PrivateMainSettingsArea;
