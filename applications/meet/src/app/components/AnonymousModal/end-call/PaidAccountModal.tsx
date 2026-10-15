import { c } from 'ttag';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';
import { LeftMeetingTitle } from './LeftMeetingTitle';

export const PaidAccountModal = ({ open, onClose, rejoin }: CTAModalBaseProps) => (
    <EndCallModalShell
        open={open}
        onClose={onClose}
        rejoin={rejoin}
        title={<LeftMeetingTitle />}
        subtitle={c('Info').t`Thank you for joining.`}
    />
);
