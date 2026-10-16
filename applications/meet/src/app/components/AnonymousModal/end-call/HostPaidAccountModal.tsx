import { c } from 'ttag';

import { UpsellModalTypes } from '@proton/meet/types/types';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';
import { PostCallTitle } from './PostCallTitle';

export const HostPaidAccountModal = ({ open, onClose, rejoin, upsellModalType }: CTAModalBaseProps) => {
    const isExpired = upsellModalType === UpsellModalTypes.MeetingExpiredHostPaid;

    return (
        <EndCallModalShell
            open={open}
            onClose={onClose}
            rejoin={isExpired ? undefined : rejoin}
            title={<PostCallTitle kind={isExpired ? 'timeUp' : 'left'} />}
            subtitle={c('Info').t`Thank you for hosting a premium meeting.`}
            upsellModalType={upsellModalType}
        />
    );
};
