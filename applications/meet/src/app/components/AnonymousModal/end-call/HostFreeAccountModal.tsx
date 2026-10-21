import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';

import { getMeetUpgradeLink } from '../../../utils/getMeetUpgradeLink';
import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';
import { PostCallTitle } from './PostCallTitle';

export const HostFreeAccountModal = ({ open, onClose, rejoin, action, upsellModalType }: CTAModalBaseProps) => {
    const goToSettings = useSettingsLink();
    const isExpired = upsellModalType === UpsellModalTypes.MeetingExpiredHostFree;
    const { hasSubscriptionWithoutMeet } = useMeetSelector(selectSubscriptionStatus);
    const link = getMeetUpgradeLink(hasSubscriptionWithoutMeet);

    return (
        <EndCallModalShell
            open={open}
            onClose={onClose}
            actions={
                <Button
                    className="rounded-full px-10 py-4 text-semibold primary w-full"
                    onClick={() => {
                        onClose();
                        goToSettings(link);
                        action();
                    }}
                    size="medium"
                >
                    {c('Action').t`Get Meet Professional`}
                </Button>
            }
            rejoin={isExpired ? undefined : rejoin}
            title={<PostCallTitle kind={isExpired ? 'timeUp' : 'left'} />}
            subtitle={
                isExpired
                    ? c('Info')
                          .t`This meeting reached the time limit of a free plan. Upgrade to extend your meeting length in future calls.`
                    : c('Info')
                          .t`Meet without restrictions. Upgrade to remove the 1-hour limit and host up to 100 participants.`
            }
            upsellModalType={upsellModalType}
        />
    );
};
