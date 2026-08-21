import { Children, type ReactNode, cloneElement, isValidElement, useRef } from 'react';

import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import clsx from '@proton/utils/clsx';

import useAppTitle from '../../hooks/useAppTitle';
import ErrorBoundary from '../app/ErrorBoundary';
import PrivateMainArea from './PrivateMainArea';
import SubSettingsSection from './SubSettingsSection';
import { getIsSubsectionAvailable } from './helper';
import { SettingsCardMaxWidth, SettingsLayoutVariant } from './interface';
import type { SettingsAreaConfig } from './interface';
import { useScrollRestoration } from './useScrollRestoration';

interface PrivateMainSettingsAreaBaseProps {
    breadcrumbs?: ReactNode;
    backButton?: ReactNode;
    title?: string;
    /** Rendered next to the title, e.g. a `Beta` badge. Kept separate from `title` so the document title stays plain text. */
    titleBadge?: ReactNode;
    noTitle?: boolean;
    description?: ReactNode;
    children?: ReactNode;
    wrapperClass?: string;
    mainAreaClass?: string;
    style?: React.CSSProperties;
    variant?: SettingsLayoutVariant;
    maxWidth?: SettingsCardMaxWidth;
}

export const PrivateMainSettingsAreaBase = ({
    breadcrumbs,
    backButton,
    title,
    titleBadge,
    noTitle,
    description,
    children,
    variant = SettingsLayoutVariant.Default,
    wrapperClass = 'container-section-sticky',
    mainAreaClass,
    style,
    maxWidth,
}: PrivateMainSettingsAreaBaseProps) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);

    useAppTitle(title);

    useScrollRestoration(mainAreaRef);

    const wrappedSections = Children.toArray(children).map((child) => {
        if (!isValidElement(child)) {
            return null;
        }

        return cloneElement(child);
    });

    return (
        <PrivateMainArea
            ref={mainAreaRef}
            className={clsx(variant === 'card' && 'bg-lowered settings-cards', mainAreaClass)}
        >
            <div
                className={clsx(
                    variant === 'card' &&
                        'w-full p-4 lg:pt-6 xl:pt-12 max-w-custom mx-0 lg:mx-4 xl:mx-6 xxl:mx-14 transition-spacings',
                    wrapperClass
                )}
                style={{ '--max-w-custom': maxWidth, ...style }}
            >
                {breadcrumbs && <div className="mt-6 md:mt-0">{breadcrumbs}</div>}
                {noTitle ? (
                    backButton && <div className="mt-6 md:mt-0">{backButton}</div>
                ) : (
                    <SettingsPageTitle
                        className={clsx(
                            'flex items-center gap-2',
                            variant === SettingsLayoutVariant.Mobile && 'text-xl',
                            variant === SettingsLayoutVariant.Default && 'mt-14',
                            variant === SettingsLayoutVariant.Card && 'text-5xl',
                            description ||
                                variant === SettingsLayoutVariant.Card ||
                                variant === SettingsLayoutVariant.Mobile
                                ? 'mb-5'
                                : 'mb-14'
                        )}
                    >
                        {backButton}
                        {title}
                        {titleBadge}
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
    wrapperClass?: string;
    mainAreaClass?: string;
    style?: React.CSSProperties;
    variant?: SettingsLayoutVariant;
    maxWidth?: SettingsCardMaxWidth;
}

const PrivateMainSettingsArea = ({
    children,
    config,
    wrapperClass,
    mainAreaClass,
    style,
    variant = SettingsLayoutVariant.Default,
    maxWidth = SettingsCardMaxWidth.Wide,
}: PrivateMainSettingsAreaProps) => {
    const { text, title, noTitle, description, subsections } = config;

    const wrappedSections = Children.toArray(children).map((child, i) => {
        if (!isValidElement(child)) {
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
                invisibleTitle={subsectionConfig.invisibleTitle}
                beta={subsectionConfig.beta}
                variant={subsectionConfig.variant}
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
            wrapperClass={wrapperClass}
            mainAreaClass={mainAreaClass}
            style={style}
            noTitle={noTitle}
            variant={variant}
            maxWidth={maxWidth}
        >
            {wrappedSections}
        </PrivateMainSettingsAreaBase>
    );
};

export default PrivateMainSettingsArea;
