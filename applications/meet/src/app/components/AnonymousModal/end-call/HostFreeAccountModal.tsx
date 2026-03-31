import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const HostFreeAccountModal = ({ open, onClose, action, rejoin }: CTAModalBaseProps) => (
    <EndCallModalShell
        open={open}
        onClose={onClose}
        actions={
            <Button
                className="rounded-full px-10 py-4 text-semibold primary w-full"
                onClick={() => {
                    onClose();
                    action();
                }}
                size="medium"
            >
                {c('Action').t`Get Meet Professional`}
            </Button>
        }
        rejoin={rejoin}
        title={c('Info').t`You left the meeting`}
        subtitle={c('Info')
            .t`Meet without restrictions. Upgrade to remove the 1-hour limit and host up to 100 participants.`}
    />
);
