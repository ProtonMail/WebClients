import { useEffect, useState } from 'react';

import { Loader, useApi } from '@proton/components/index';

import { TvSignInCompleted } from '../components/TvSignInCompleted';
import { TvSignInFailed } from '../components/TvSignInFailed';
import { forkSession } from '../utils/forkSession';
import { getChildClientId } from '../utils/getChildClientId';

enum ForkSessionStep {
    FETCHING_CODE,
    DEVICE_CONNECTED,
    DEVICE_CONNECTION_ERROR,
}

const childClientId = getChildClientId();

export const TvContainerSignedIn = ({ code }: { code: string }) => {
    const api = useApi();
    const [step, setStep] = useState<ForkSessionStep>(ForkSessionStep.FETCHING_CODE);

    useEffect(() => {
        if (code) {
            forkSession(api, childClientId, code)
                .then(() => setStep(ForkSessionStep.DEVICE_CONNECTED))
                .catch(() => setStep(ForkSessionStep.DEVICE_CONNECTION_ERROR));
        }
    }, []);

    return (
        <>
            {step === ForkSessionStep.FETCHING_CODE && <Loader />}
            {step === ForkSessionStep.DEVICE_CONNECTED && <TvSignInCompleted />}
            {step === ForkSessionStep.DEVICE_CONNECTION_ERROR && <TvSignInFailed />}
        </>
    );
};
