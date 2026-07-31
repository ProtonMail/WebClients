import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectAdmissionCountdown } from '@proton/meet/store/slices/waitingRoomSlice';

const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export const WaitingRoomAdmissionCounter = () => {
    const countdown = useMeetSelector(selectAdmissionCountdown);
    const formattedCountdown = formatCountdown(countdown);

    return (
        <span className="rounded-full bg-weak px-4 py-1 text-sm color-weak" aria-live="polite">
            {c('Info').t`Expires in ${formattedCountdown}`}
        </span>
    );
};
