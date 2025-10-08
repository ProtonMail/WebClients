import type { FormEvent } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Icon from '@proton/components/components/icon/Icon';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { VPN_TV_CLIENT_IDS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import TVCodeInputs from './TVCodeInputs';

enum STEP {
    ENTER_CODE,
    DEVICE_CONNECTED,
}

interface Props {
    background?: boolean;
}

const TVContainer = ({ background = true }: Props) => {
    const [code, setCode] = useState('');
    const [step, setStep] = useState(STEP.ENTER_CODE);
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const location = useLocation();
    const [error, setError] = useState('');
    const childClientId = (() => {
        if (VPN_TV_PATHS_MAP.apple.includes(location.pathname)) {
            return VPN_TV_CLIENT_IDS.APPLE;
        }
        return VPN_TV_CLIENT_IDS.ANDROID;
    })();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (loading || !code) {
            return;
        }

        try {
            setError('');
            await api(
                pushForkSession({
                    ChildClientID: childClientId,
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
                    <label className="h3 text-center mb-3" htmlFor="code-input">{c('Label')
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
                        <Button
                            color="norm"
                            loading={loading}
                            type="submit"
                            pill
                            className="text-uppercase text-bold mt-8 mb-6 mx-auto"
                        >
                            <span className="p-2 inline-flex">
                                {error ? c('Action').t`Verify code again` : c('Action').t`Verify code`}
                            </span>
                        </Button>
                    </div>
                </form>
            );
        }

        if (step === STEP.DEVICE_CONNECTED) {
            return (
                <>
                    <h2>{c('Title').t`Device connected!`}</h2>
                    <div className="flex justify-center my-8">
                        <span className="inline-flex bg-success rounded-50 p-7">
                            <Icon name="checkmark" size={15} />
                        </span>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div
            className={clsx(
                ' h-full flex *:min-size-auto flex-column flex-nowrap items-center overflow-auto',
                background && 'tv-background-container ui-prominent'
            )}
        >
            <div className="flex justify-center items-center pt-7">
                <div className="w-custom" style={{ '--w-custom': '9.375rem' }}>
                    <Href href="https://protonvpn.com" target="_self">
                        <VpnLogo />
                    </Href>
                </div>
                <h3 className="mb-0 pl-1 text-uppercase text-bold">{c('Title').t`TV sign in`}</h3>
            </div>
            <div className="flex flex-column flex-1 flex-nowrap shrink-0">
                <div className="m-auto p-7 shrink-0 max-w-custom" style={{ '--max-w-custom': '30em' }}>
                    {render()}
                </div>
            </div>
        </div>
    );
};

export default TVContainer;
