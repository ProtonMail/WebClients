import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { BaseSpotlightMessage } from '@proton/pass/components/Spotlight/SpotlightContent';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { selectPlanDisplayName, selectUserPlan } from '@proton/pass/store/selectors';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { epochToRelativeDate } from '@proton/pass/utils/time/format';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const UserRenewal: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const { onLink } = usePassCore();
    const { SSO_URL } = usePassConfig();
    const plan = useSelector(selectUserPlan);
    const planName = useSelector(selectPlanDisplayName);
    const endDate = epochToRelativeDate(plan?.SubscriptionEnd!);
    const upgrade = () => onLink(`${SSO_URL}/pass/dashboard?source=banner#your-subscriptions`);

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
                    onClick={pipe(onClose, upgrade)}
                    style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                >
                    {c('Action').t`Reactivate now`}
                </Button>
            </div>
        </div>
    );
};
