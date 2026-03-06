import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const RemovedFromMeetingModal = ({ open, onClose }: CTAModalBaseProps) => {
    return (
        <EndCallModalShell
            open={open}
            onClose={onClose}
            actions={
                <Button
                    className="create-account-low-pressure-button rounded-full px-10 py-4 text-semibold w-full"
                    onClick={() => {
                        onClose();
                    }}
                    size="medium"
                >
                    {c('Action').t`Back to dashboard`}
                </Button>
            }
            title={c('Info').t`You were removed from the meeting`}
            subtitle={c('Info')
                .t`The host has removed you from this meeting. If this was a mistake, ask the host to invite you again.`}
        />
    );
};
