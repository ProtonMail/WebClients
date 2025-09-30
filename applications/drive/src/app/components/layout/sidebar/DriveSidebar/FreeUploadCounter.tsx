import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { VintageClock } from '@proton/components/components/vintageClock/VintageClock';
import { toMinutesAndSeconds } from '@proton/shared/lib/helpers/time';

import { useFreeUploadStore } from '../../../../zustand/freeUpload/freeUpload.store';

export function FreeUploadCounter() {
    const { bigCounterVisible, secondsLeft } = useFreeUploadStore(
        useShallow((state) => ({
            bigCounterVisible: state.bigCounterVisible,
            secondsLeft: state.secondsLeft,
        }))
    );
    const [minutes, seconds] = toMinutesAndSeconds(secondsLeft);

    if (bigCounterVisible) {
        return null;
    }

    return (
        <div className="flex justify-center pb-6">
            <p className="text-bold pb-3">{c('Onboarding Info')
                .t`Files uploaded now will not count towards your storage limit`}</p>
            <VintageClock coarseValue={minutes} fineValue={seconds} />
        </div>
    );
}
