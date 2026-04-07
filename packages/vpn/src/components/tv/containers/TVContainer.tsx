import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';

import { TvSignInCompleted } from '../components/TvSignInCompleted';
import { forkSession } from '../utils/forkSession';
import { getChildClientId } from '../utils/getChildClientId';

import './TvContainer.scss';

enum STEP {
    ENTER_CODE,
    DEVICE_CONNECTED,
}

const childClientId = getChildClientId();

export const TVContainer = () => {
    const [code, setCode] = useState('');
    const [step, setStep] = useState(STEP.ENTER_CODE);
    const [error, setError] = useState('');
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (loading || !code) {
            return;
        }

        try {
            setError('');
            await forkSession(api, childClientId, code);
            setStep(STEP.DEVICE_CONNECTED);
        } catch (error: any) {
            const { data: { Error = '' } = {} } = error;
            setError(Error);
            throw error;
        }
    };

    const render = () => {
        if (loading) {
            return <Loader size="large" />;
        }

        switch (step) {
            case STEP.ENTER_CODE:
                return (
                    <form onSubmit={(event) => withLoading(handleSubmit(event))}>
                        <h3 className="font-bold text-center mb-3">
                            {c('Label').t`Enter the code displayed on your TV`}
                        </h3>
                        <TotpInput
                            length={8}
                            onValue={(value) => setCode(value.toLocaleUpperCase())}
                            value={code}
                            centerDivider
                            type="alphabet"
                            autoComplete="one-time-code"
                            id="tv-input"
                        />
                        {error ? (
                            <>
                                <p className="mt-8 mb-0 pl-4 text-center color-danger">{c('Error')
                                    .t`Code is incorrect or not valid anymore`}</p>
                                <p className="m-0 text-center border-none">{c('Error')
                                    .t`If the time on your TV has expired, click on Refresh on your TV and enter your code again.`}</p>
                            </>
                        ) : null}
                        <Button
                            color="norm"
                            loading={loading}
                            type="submit"
                            fullWidth
                            className="text-uppercase text-bold mt-8 mb-6 mx-auto p-4"
                        >
                            {error ? c('Action').t`Verify code again` : c('Action').t`Verify code`}
                        </Button>
                    </form>
                );

            case STEP.DEVICE_CONNECTED:
                return <TvSignInCompleted />;

            default:
                return null;
        }
    };

    return (
        <div className="tv-container-bg h-full flex *:min-size-auto flex-column flex-nowrap items-center overflow-auto">
            <div className="flex justify-center items-center pt-7">
                <div className="w-custom" style={{ '--w-custom': '9.375rem' }}>
                    <Href href="https://protonvpn.com" target="_self">
                        <VpnLogo />
                    </Href>
                </div>
            </div>
            <div className="flex flex-column flex-1 flex-nowrap shrink-0">
                <div className="m-auto p-7 shrink-0 max-w-custom" style={{ '--max-w-custom': '30em' }}>
                    {render()}
                </div>
            </div>
        </div>
    );
};
