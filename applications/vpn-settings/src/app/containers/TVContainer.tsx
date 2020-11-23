import React, { useState } from 'react';
import { c } from 'ttag';
import { VpnLogo, PrimaryButton, Icon, Alert, Href, useApi, useLoading } from 'react-components';
import { pushForkSession } from 'proton-shared/lib/api/auth';
import { CLIENT_IDS } from 'proton-shared/lib/constants';
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
                    ChildClientID: CLIENT_IDS.AndroidTvVPN,
                    Independent: 1,
                    UserCode: code,
                })
            );
            setStep(STEP.DEVICE_CONNECTED);
        } catch (error) {
            const { data: { Error = '' } = {} } = error;
            setError(Error);
            throw error;
        }
    };

    const render = () => {
        if (step === STEP.ENTER_CODE) {
            return (
                <form onSubmit={(event) => withLoading(handleSubmit(event))}>
                    <label className="h2" htmlFor="code-input">{c('Label')
                        .t`Enter the code displayed on your TV`}</label>
                    <TVCodeInputs value={code} setValue={setCode} />
                    {error ? (
                        <>
                            <p className="mt1 pl1 aligncenter color-global-warning">{c('Error')
                                .t`Code wrong or not valid anymore`}</p>
                            <Alert type="error" className="mt1">{c('Error')
                                .t`If the time on your TV has expired. Click on Refresh on your tv and try again your code.`}</Alert>
                        </>
                    ) : null}
                    <div className="flex">
                        <PrimaryButton loading={loading} type="submit" className="mt2 mb1-5 mlauto">
                            {error ? c('Action').t`Verify code again` : c('Action').t`Verify code`}
                        </PrimaryButton>
                    </div>
                </form>
            );
        }

        if (step === STEP.DEVICE_CONNECTED) {
            return (
                <>
                    <h2>{c('Title').t`Device connected!`}</h2>
                    <div className="flex flex-justify-center mt2 mb2">
                        <span className="inline-flex bg-global-success rounded50 p2">
                            <Icon name="#shape-on" size={60} className="stroke-currentColor color-global-light" />
                        </span>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <>
            <div className="w150p center pt1">
                <Href url="https://protonvpn.com" target="_self">
                    <VpnLogo className="fill-primary" />
                </Href>
                <h1 className="color-primary pt1">{c('Title').t`TV log in`}</h1>
            </div>
            <div className="flex flex-column flex-nowrap flex-item-noshrink">
                <div className="center bg-white-dm color-global-grey-dm mt2 mw40e w100 p2 bordered-container flex-item-noshrink">
                    {render()}
                </div>
            </div>
        </>
    );
};

export default TVContainer;
