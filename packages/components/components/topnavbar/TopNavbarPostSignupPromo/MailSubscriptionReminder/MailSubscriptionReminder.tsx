import { useRef } from 'react';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useUpsellConfig from '@proton/components/components/upsell/config/useUpsellConfig';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { FeatureCode, useFeature } from '@proton/features';
import {
    APPS,
    type APP_NAMES,
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_PATHS,
    SECOND,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import TopNavbarUpgradeButton from '../../TopNavbarUpgradeButton';
import LayoutPrivacy from './content/LayoutPrivacy';
import LayoutProductivity from './content/LayoutProductivity';
import { useMailSubscriptionReminder } from './useMailSubscriptionReminder';

interface Props {
    app: APP_NAMES;
}

// We don't want the value to change on each render
const versionToDisplay = Math.random() > 0.5;
const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.BANNER,
    feature: versionToDisplay
        ? MAIL_UPSELL_PATHS.SUBSCRIPTION_REMINDER_PRIVACY
        : MAIL_UPSELL_PATHS.SUBSCRIPTION_REMINDER_PRODUCTIVITY,
});

export const MailSubscriptionReminder = ({ app }: Props) => {
    const buttonRef = useRef(null);

    const goToSettings = useSettingsLink();

    const { upgradePath, onUpgrade } = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
    const { update } = useFeature(FeatureCode.SubscriptionLastReminderDate);

    const { isEligible } = useMailSubscriptionReminder();
    const show = useSpotlightShow(isEligible, 3 * SECOND);

    const onUpgradeClick = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            goToSettings(upgradePath, APPS.PROTONMAIL);
        }
    };

    const handleClose = () => {
        void update(Math.floor(Date.now() / 1000));
    };

    const content = versionToDisplay ? (
        <LayoutPrivacy onClick={onUpgradeClick} onClose={handleClose} />
    ) : (
        <LayoutProductivity onClick={onUpgradeClick} onClose={handleClose} />
    );

    return (
        <Spotlight
            anchorRef={buttonRef}
            innerClassName="p-6 pt-12"
            hasClose={false}
            show={show}
            content={content}
            originalPlacement="bottom"
        >
            <div ref={buttonRef}>
                <TopNavbarUpgradeButton app={app} />
            </div>
        </Spotlight>
    );
};
