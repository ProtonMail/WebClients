import type { FC } from 'react';

import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

export const Checkmark: FC<{ on: boolean }> = ({ on = false }) => {
    return on ? (
        <IcCheckmarkCircleFilled color="var(--signal-success)" size={6} />
    ) : (
        <IcCheckmarkCircle color="var(--interaction-weak-major-3)" size={6} />
    );
};
