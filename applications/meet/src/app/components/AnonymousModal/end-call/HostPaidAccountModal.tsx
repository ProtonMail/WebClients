import { c } from 'ttag';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const HostPaidAccountModal = ({ open, onClose, rejoin }: CTAModalBaseProps) => (
    <EndCallModalShell
        open={open}
        onClose={onClose}
        rejoin={rejoin}
        title={c('Info').t`You left the meeting`}
        subtitle={c('Info').t`Thank you for hosting a premium meeting.`}
    />
);
