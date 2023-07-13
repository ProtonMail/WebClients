import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon, PrimaryButton, VpnLogo, useApi } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { pushForkSession } from '@proton/shared/lib/api/auth';

import TVCodeInputs from './TVCodeInputs';

enum STEP {
    ENTER_CODE,
    DEVICE_CONNECTED,
}

const TVContainer = () => {
    const [code, setCode] = useState('');
    const [step, setStep] = useState(STEP.ENTER_CODE);
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (loading || !code) {
            return;
        }

        try {
            setError('');
            await api(
                pushForkSession({
                    ChildClientID: 'android_tv-vpn',
                    Independent: 1,
                    UserCode: code,
                })
            );
            setStep(STEP.DEVICE_CONNECTED);
        } catch (error: any) {
            const { data: { Error = '' } = {} } = error;
            setError(Error);
            throw error;
        }
    };

    const render = () => {
        if (step === STEP.ENTER_CODE) {
            return (
                <form onSubmit={(event) => withLoading(handleSubmit(event))}>
                    <label className="h3 text-center" htmlFor="code-input">{c('Label')
                        .t`Enter the code displayed on your TV`}</label>
                    <TVCodeInputs value={code} setValue={setCode} />
                    {error ? (
                        <>
                            <p className="mt-8 mb-0 pl-4 text-center color-danger">{c('Error')
                                .t`Code wrong or not valid anymore`}</p>
                            <p className="m-0 text-center border-none">{c('Error')
                                .t`If the time on your TV has expired, click on Refresh on your TV and enter your code again.`}</p>
                        </>
                    ) : null}
                    <div className="flex">
                        <PrimaryButton
                            loading={loading}
                            type="submit"
                            pill
                            className="text-uppercase text-bold mt-8 mb-6 mx-auto"
                        >
                            <span className="p-2 inline-flex">
                                {error ? c('Action').t`Verify code again` : c('Action').t`Verify code`}
                            </span>
                        </PrimaryButton>
                    </div>
                </form>
            );
        }

        if (step === STEP.DEVICE_CONNECTED) {
            return (
                <>
                    <h2>{c('Title').t`Device connected!`}</h2>
                    <div className="flex flex-justify-center my-8">
                        <span className="inline-flex bg-success rounded-50 p-7">
                            <Icon name="checkmark" size={60} />
                        </span>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className="ui-prominent background-container h100 flex-no-min-children flex-column flex-nowrap flex-align-items-center scroll-if-needed">
            <div className="flex flex-justify-center flex-align-items-center pt-7">
                <div className="w150p">
                    <Href href="https://protonvpn.com" target="_self">
                        <VpnLogo />
                    </Href>
                </div>
                <h3 className="mb-0 pl-1 text-uppercase text-bold">{c('Title').t`TV sign in`}</h3>
            </div>
            <div className="flex flex-column flex-item-fluid flex-nowrap flex-item-noshrink">
                <div className="m-auto p-7 flex-item-noshrink max-w30e">{render()}</div>
            </div>
        </div>
    );
};

export default TVContainer;
