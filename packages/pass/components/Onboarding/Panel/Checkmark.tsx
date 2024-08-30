import { type FC } from 'react';

import { Icon } from '@proton/components';

export const Checkmark: FC<{ on: boolean }> = ({ on = false }) => {
    return (
        <Icon
            name={on ? 'checkmark-circle-filled' : 'checkmark-circle'}
            color={on ? 'var(--signal-success)' : 'var(--interaction-weak-major-3)'}
            size={6}
        />
    );
};
