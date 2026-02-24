import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { SubscriptionPanel } from '../../../upsells';
import LumoLogoHeader from "../../../layouts/header/LumoLogo";

export const PaidSubscriptionPanel = () => {
    const { isVisionary, hasLumoB2B, userIsMember } = useLumoPlan();

    if (userIsMember) {
        return null;
    }

    // TODO: improve messages for b2b users
    const subscriptionMessage = isVisionary
        ? c('collider_2025: Status')
              .t`${LUMO_SHORT_APP_NAME}+ is included in your Visionary plan and you have access to these features:`
        : c('collider_2025: Status')
              .t`You are subscribed to ${LUMO_SHORT_APP_NAME}+ and have access to these features:`;

    return (
        <SubscriptionPanel
            message={!hasLumoB2B ? subscriptionMessage : undefined}
            logo={hasLumoB2B && <LumoLogoHeader />}
        >
            <ButtonLike
                as={SettingsLink}
                path={''}
                shape="outline"
                color="weak"
                size="medium"
                className="shrink-0 manage-plan mt-0 md:mt-2"
            >
                {c('Action').t`Manage`}
            </ButtonLike>
        </SubscriptionPanel>
    );
};

PaidSubscriptionPanel.displayName = 'PaidSubscriptionPanel';
