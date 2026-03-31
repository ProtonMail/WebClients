import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { CTAModalBaseProps } from '../shared/types';
import { EndCallModalShell } from './EndCallModalShell';

export const GuestAccountModal = ({ open, onClose, action, rejoin }: CTAModalBaseProps) => {
    const subtitle = useMemo(() => {
        const options = [
            c('Info').t`Create an account to host meetings with up to 50 participants.`,
            c('Info')
                .t`Get a personal meeting room. Create an account to have a personal meeting link that you can use at any time.`,
            c('Info').t`Schedule your next meeting. Create an account to schedule meetings with your calendar.`,
        ];
        return options[Math.floor(Math.random() * options.length)];
    }, []);

    return (
        <EndCallModalShell
            open={open}
            onClose={onClose}
            actions={
                <>
                    <Button
                        className="secondary rounded-full px-10 py-4 text-semibold flex-auto w-full md:w-auto"
                        onClick={() => {
                            onClose();
                            action();
                        }}
                        size="medium"
                    >
                        {c('Action').t`Create a free account`}
                    </Button>
                    <Button
                        className="tertiary rounded-full px-10 py-4 text-semibold flex-auto w-full md:w-auto"
                        onClick={() => {
                            onClose();
                            action();
                        }}
                        size="medium"
                    >
                        {c('Action').t`Get Meet Professional`}
                    </Button>
                </>
            }
            rejoin={rejoin}
            title={c('Info').t`You left the meeting`}
            subtitle={subtitle}
        />
    );
};
