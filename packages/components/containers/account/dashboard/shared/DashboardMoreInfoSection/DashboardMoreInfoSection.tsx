import type { ReactElement, ReactNode } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import clsx from '@proton/utils/clsx';

import { getTelemetryUserTier } from '../../../../../helpers/getTelemetryUserTier';

/**
 * CardAction values:
 * - internal_nav: card navigates within the account web app itself (SPA at
 *   account.proton.me / account.protonvpn.com), e.g. to another settings
 *   page. Handled via SPA routing, same tab, no full page load.
 *
 * - external_link: card navigates to any URL outside the account app,
 *   even if it's still a Proton domain (e.g. protonvpn.com/support or a
 *   proton.me marketing page). If it leaves the application, it's external.
 *
 * - upsell_modal: card is gated behind a paid feature; clicking it opens
 *   the upsell modal instead of navigating anywhere.
 */
type CardAction = 'upsell_modal' | 'internal_nav' | 'external_link';

export interface DashboardMoreInfoSection {
    id: string;
    cardAction: CardAction | undefined;
    image: string;
    title: () => string;
    description: () => string | ReactElement;
    tag?: ReactElement;
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

export const DashboardMoreInfoSections = ({
    sections,
    app,
}: {
    sections: DashboardMoreInfoSection[];
    app: APP_NAMES;
}) => {
    const [user] = useUser();
    const api = useApi();

    const handleOnClick = (id: string, cardAction: CardAction | undefined, onClickAction?: () => void) => {
        if (cardAction) {
            void sendTelemetryReport({
                api,
                delay: false,
                event: TelemetryAccountDashboardEvents.featureCardClick,
                measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                dimensions: {
                    app,
                    feature: id,
                    card_action: cardAction,
                    user_tier: getTelemetryUserTier(user),
                },
            });
        }
        onClickAction?.();
    };

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
                                onClick={() => handleOnClick(section.id, section.cardAction, section.onClick)}
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
                                    <IcChevronRight
                                        key={`icon-${key}`}
                                        className="shrink-0 color-hint rtl:mirror"
                                        size={6}
                                    />
                                )}
                            </Element>
                        );
                    })}
                </div>
            </DashboardCardContent>
        </DashboardCard>
    );
};
