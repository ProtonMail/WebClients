import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const FreeAccountModal = ({ open, onClose, action, rejoin }: CTAModalBaseProps) => (
    <EndCallModalShell
        open={open}
        onClose={onClose}
        actions={
            <Button
                className="create-account-low-pressure-button rounded-full px-10 py-4 text-semibold w-full"
                onClick={() => {
                    onClose();
                    action();
                }}
                size="medium"
            >
                {c('Action').t`Start your own meeting`}
            </Button>
        }
        rejoin={rejoin}
        title={c('Info').t`You left your meeting`}
        subtitle={c('Info')
            .t`Host your own secure meeting. Start a call in ${MEET_APP_NAME} and share the link to invite anyone to join. Simple, secure, and free.`}
    />
);
