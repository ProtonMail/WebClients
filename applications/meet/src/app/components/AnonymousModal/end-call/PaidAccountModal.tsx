import { c } from 'ttag';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';
import { PostCallTitle } from './PostCallTitle';

export const PaidAccountModal = ({ open, onClose, rejoin }: CTAModalBaseProps) => (
    <EndCallModalShell
        open={open}
        onClose={onClose}
        rejoin={rejoin}
        title={<PostCallTitle kind="left" />}
        subtitle={c('Info').t`Thank you for joining.`}
    />
);
