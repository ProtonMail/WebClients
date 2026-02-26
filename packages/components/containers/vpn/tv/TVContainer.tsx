import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { VPN_TV_CLIENT_IDS, VPN_TV_PATHS_MAP } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import TVCodeInputs from './TVCodeInputs';

enum STEP {
    ENTER_CODE,
    DEVICE_CONNECTED,
    DEVICE_CONNECTION_ERROR,
}

async function forkSession(api: Api, childClientId: string, code: string) {
    await api(
        pushForkSession({
            ChildClientID: childClientId,
            Independent: 1,
            UserCode: code,
        })
    );
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
    const searchParams = new URLSearchParams(location.search);
    const tvAuthCode = searchParams.get('code');

    const [error, setError] = useState('');
    const childClientId = (() => {
        if (VPN_TV_PATHS_MAP.apple.includes(location.pathname)) {
            return VPN_TV_CLIENT_IDS.APPLE;
        }
        return VPN_TV_CLIENT_IDS.ANDROID;
    })();

    useEffect(() => {
        if (tvAuthCode) {
            withLoading(forkSession(api, childClientId, tvAuthCode))
                .then(() => setStep(STEP.DEVICE_CONNECTED))
                .catch(() => setStep(STEP.DEVICE_CONNECTION_ERROR));
        }
    }, []);

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
        if (step === STEP.ENTER_CODE && !tvAuthCode) {
            return (
                <form onSubmit={(event) => withLoading(handleSubmit(event))}>
                    <label className="h3 text-center mb-3" htmlFor="code-input">{c('Label')
                        .t`Enter the code displayed on your TV`}</label>
                    <TVCodeInputs value={code} setValue={setCode} />
                    {error ? (
                        <>
                            <p className="mt-8 mb-0 pl-4 text-center color-danger">{c('Error')
                                .t`Code is incorrect or not valid anymore`}</p>
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
                            <IcCheckmark size={15} />
                        </span>
                    </div>
                </>
            );
        }

        if (step === STEP.DEVICE_CONNECTION_ERROR) {
            return (
                <>
                    <h2 className="text-center">{c('Title').t`Error`}</h2>
                    <div className="flex justify-center my-8">
                        <span className="inline-flex color-danger rounded-50 p-7">
                            <IcCrossCircle size={15} />
                        </span>
                    </div>
                    <p className="m-0 text-center border-none">{c('Error')
                        .t`Something went wrong connecting your TV. Scan the QR code on your TV once more.`}</p>
                </>
            );
        }

        if (loading) {
            return <Loader size="large" />;
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
