import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { BaseSpotlightMessage } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { selectPlanDisplayName, selectUserPlan } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { epochToRelativeDate } from '@proton/pass/utils/time/format';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const UserRenewal: FC<BaseSpotlightMessage> = () => {
    const { onLink } = usePassCore();
    const { SSO_URL } = usePassConfig();
    const { acknowledge } = useSpotlight();
    const plan = useSelector(selectUserPlan);
    const planName = useSelector(selectPlanDisplayName);
    const endDate = epochToRelativeDate(plan?.SubscriptionEnd!);

    return (
        <div className="flex-1">
            <strong className="block color-invert">{c('Title')
                .t`Your ${planName} subscription will end on ${endDate}`}</strong>
            <span className="block text-sm color-invert">
                {c('Info')
                    .t`You will no longer have access to sharing, 2FA, credit card and other advanced features in ${PASS_APP_NAME}`}
            </span>
            <div className="mt-2">
                <Button
                    pill
                    shape="solid"
                    color="norm"
                    size="small"
                    className="text-sm px-3"
                    onClick={() =>
                        acknowledge(OnboardingMessage.USER_RENEWAL, () =>
                            onLink(`${SSO_URL}/pass/dashboard?source=banner#your-subscriptions`)
                        )
                    }
                    style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                >
                    {c('Action').t`Reactivate now`}
                </Button>
            </div>
        </div>
    );
};
