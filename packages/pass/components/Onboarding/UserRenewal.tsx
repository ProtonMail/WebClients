import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { usePassConfig } from '../../hooks/usePassConfig';
import { selectPlanDisplayName, selectUserPlan } from '../../store/selectors';
import { PassFeature } from '../../types/api/features';
import { pipe } from '../../utils/fp/pipe';
import { epochToDate } from '../../utils/time/format';
import { useAuthStore } from '../Core/AuthStoreProvider';
import { useOnline } from '../Core/ConnectivityProvider';
import { usePassCore } from '../Core/PassCoreProvider';
import type { BaseSpotlightMessage } from '../Spotlight/SpotlightContent';

export const UserRenewal: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const { onLink } = usePassCore();
    const { SSO_URL } = usePassConfig();
    const authStore = useAuthStore();
    const plan = useSelector(selectUserPlan);
    const planName = useSelector(selectPlanDisplayName);
    const online = useOnline();
    const freeCcFlag = useFeatureFlag(PassFeature.PassAllowCreditCardFreeUsers);

    if (!(plan && plan.SubscriptionEnd)) return;

    const endDate = epochToDate(plan.SubscriptionEnd);
    const title = c('Title').t`Your ${planName} subscription will end on ${endDate}`;

    const localID = authStore?.getLocalID();

    const upgrade = () =>
        onLink(
            `${SSO_URL}${localID !== undefined ? `/u/${localID}/` : '/'}pass/dashboard?source=banner#your-subscriptions`
        );

    return (
        <div className="flex-1">
            <strong className="block">{title}</strong>
            <span className="block text-sm">
                {freeCcFlag
                    ? c('Info')
                          .t`You will no longer have access to sharing, 2FA and other advanced features in ${PASS_APP_NAME}`
                    : c('Info')
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
                    disabled={!online}
                >
                    {c('Action').t`Reactivate now`}
                </Button>
            </div>
        </div>
    );
};
