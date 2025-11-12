import type { ReactElement, ReactNode } from 'react';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import clsx from '@proton/utils/clsx';

export interface DashboardMoreInfoSection {
    title: () => string;
    tag?: ReactElement;
    description: () => string | ReactElement;
    image: string;
    link?: string;
    onClick?: () => void;
}

export const DashboardMoreInfoSectionTag = ({ prefix, text }: { prefix?: ReactNode; text: string }) => {
    return (
        <div>
            <span className="inline-flex rounded-sm items-center gap-1 border border-weak bg-norm px-1">
                {prefix}
                <span className="text-sm uppercase color-weak text-semibold">{text}</span>
            </span>
        </div>
    );
};

function isClickableSection(section: DashboardMoreInfoSection) {
    return section.link || section.onClick;
}

export const DashboardMoreInfoSections = ({ sections }: { sections: DashboardMoreInfoSection[] }) => {
    return (
        <DashboardCard>
            <DashboardCardContent className="lg:h-full" paddingClass="p-3">
                <div className="flex flex-column items-center lg:justify-space-between lg:h-full gap-2">
                    {sections.map((section) => {
                        const Element = isClickableSection(section) ? 'a' : 'div';

                        const key = section.title();

                        return (
                            <Element
                                {...(section.link && {
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    href: section.link,
                                })}
                                key={key}
                                className={clsx(
                                    'flex flex-nowrap items-center p-2 gap-4 w-full relative rounded-lg text-no-decoration',
                                    isClickableSection(section) && 'interactive-pseudo-protrude'
                                )}
                                aria-label={section.title()}
                                onClick={section.onClick}
                            >
                                <figure
                                    className="w-custom rounded overflow-hidden ratio-square"
                                    style={{ '--w-custom': '4.5rem' }}
                                    key={`fig-${key}`}
                                >
                                    <img src={section.image} alt="" className="w-full" />
                                </figure>
                                <div className="w-full flex flex-column gap-1" key={`section-label-${key}`}>
                                    {section.tag}
                                    <h3 className="text-lg text-semibold m-0">{section.title()}</h3>
                                    <p className="m-0 text-ellipsis-two-lines color-weak">{section.description()}</p>
                                </div>
                                {isClickableSection(section) && (
                                    <IcChevronRight key={`icon-${key}`} className="shrink-0 color-hint" size={6} />
                                )}
                            </Element>
                        );
                    })}
                </div>
            </DashboardCardContent>
        </DashboardCard>
    );
};
