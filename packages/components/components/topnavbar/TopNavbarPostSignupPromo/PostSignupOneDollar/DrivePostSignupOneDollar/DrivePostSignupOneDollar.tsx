import { useEffect, useRef, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/index';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { TelemetryMailDrivePostSignupOneDollar } from '@proton/shared/lib/api/telemetry';
import { APP_UPSELL_REF_PATH, DRIVE_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import clsx from '@proton/utils/clsx';

import { usePostSignupOneDollarPromotionPrice } from '../components/usePostSignupOneDollarPromotionPrice';
import { EXTENDED_REMINDER_DAY, LAST_REMINDER_DAY, type PostSubscriptionOneDollarOfferState } from '../interface';
import { isStateTheSame, updatePostSignupOpenOfferState } from '../postSignupOffersHelpers';
import { DrivePostSignupDollarContent } from './DrivePostSignupOneDollarContent';
import { useDrivePostSignupOneDollar } from './useDrivePostSignupOneDollar';
import { useDrivePostSignupOneDollarTelemetry } from './useDrivePostSignupOneDollarTelemetry';

const getUpsellFeature = (daysSinceOffer: number) => {
    if (daysSinceOffer >= LAST_REMINDER_DAY) {
        return DRIVE_UPSELL_PATHS.ONE_DOLLAR_LAST_REMINDER;
    }
    if (daysSinceOffer >= EXTENDED_REMINDER_DAY) {
        return DRIVE_UPSELL_PATHS.ONE_DOLLAR_SECOND_REMINDER;
    }
    return DRIVE_UPSELL_PATHS.ONE_DOLLAR_INITIAL_REMINDER;
};

export const DrivePostSignupOneDollar = () => {
    const buttonRef = useRef(null);

    const [user] = useUser();
    const [subscription] = useSubscription();

    const { viewportWidth } = useActiveBreakpoint();
    const { openSpotlight } = useDrivePostSignupOneDollar();

    const goToSettings = useSettingsLink();

    const { sendReportDrivePostSignup } = useDrivePostSignupOneDollarTelemetry();

    const { feature: driveOfferState, update } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.DrivePostSignupOneDollarState
    );

    const daysSinceOffer = differenceInDays(
        Date.now(),
        fromUnixTime(driveOfferState?.Value?.offerStartDate || Date.now())
    );

    useEffect(() => {
        if (openSpotlight && driveOfferState) {
            sendReportDrivePostSignup({
                event: TelemetryMailDrivePostSignupOneDollar.automaticModalOpen,
                dimensions: {
                    daysSinceOffer,
                },
            });
        }
    }, [driveOfferState?.Value]);

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const show = useSpotlightShow(spotlightState, 3000);

    const { pricingTitle } = usePostSignupOneDollarPromotionPrice({
        offerProduct: 'drive',
    });

    const upgradeText = c('specialoffer: Link').jt`Upgrade for ${pricingTitle}`;
    const upgradeIcon = upgradeText.length > 15 && viewportWidth['>=large'] ? undefined : 'upgrade';

    const handleClose = () => {
        setSpotlightState(false);

        const newState = updatePostSignupOpenOfferState(driveOfferState?.Value);
        if (isStateTheSame(newState, driveOfferState?.Value)) {
            return;
        }

        void update(newState);
    };

    const handleUpsellClick = () => {
        handleClose();
        sendReportDrivePostSignup({
            event: TelemetryMailDrivePostSignupOneDollar.clickUpsellButton,
            dimensions: {
                daysSinceOffer,
            },
        });

        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: getUpsellFeature(daysSinceOffer),
        });

        goToSettings(
            addUpsellPath(
                getUpgradePath({
                    user,
                    subscription,
                    plan: PLANS.DRIVE,
                    cycle: CYCLE.MONTHLY,
                    coupon: COUPON_CODES.TRYDRIVEPLUS2024,
                    app: 'proton-drive',
                    target: 'checkout',
                }),
                upsellRef
            )
        );
    };

    const isLastReminderDay = daysSinceOffer >= LAST_REMINDER_DAY;

    return (
        <Spotlight
            anchorRef={buttonRef}
            className={clsx(!isLastReminderDay && 'rounded-xl')}
            innerClassName={clsx('rounded-xl', isLastReminderDay ? undefined : 'p-0')}
            show={show || spotlightState}
            onClose={() => {
                handleClose();
                sendReportDrivePostSignup({
                    event: TelemetryMailDrivePostSignupOneDollar.closeOffer,
                    dimensions: {
                        daysSinceOffer,
                    },
                });
            }}
            content={
                <DrivePostSignupDollarContent
                    pricingTitle={pricingTitle}
                    onClose={() => {
                        handleClose();
                        sendReportDrivePostSignup({
                            event: TelemetryMailDrivePostSignupOneDollar.closeOffer,
                            dimensions: {
                                daysSinceOffer,
                            },
                        });
                    }}
                    onUpsellClick={handleUpsellClick}
                    daysSinceOffer={daysSinceOffer}
                />
            }
        >
            <div ref={buttonRef}>
                <PromotionButton
                    as={ButtonLike}
                    className="flex items-center gap-2"
                    onClick={() => {
                        if (isLastReminderDay) {
                            handleUpsellClick();
                        } else {
                            sendReportDrivePostSignup({
                                event: TelemetryMailDrivePostSignupOneDollar.clickTopNavbar,
                                dimensions: {
                                    daysSinceOffer,
                                },
                            });
                            setSpotlightState(true);
                        }
                    }}
                    iconName={upgradeIcon}
                    size="medium"
                    fullGradient
                    responsive
                >
                    {upgradeText}
                </PromotionButton>
            </div>
        </Spotlight>
    );
};
