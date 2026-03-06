import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const MeetingEndedModal = ({ open, onClose }: CTAModalBaseProps) => {
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
            title={c('Info').t`Meeting ended`}
            subtitle={c('Info').t`The host ended this meeting.`}
        />
    );
};
