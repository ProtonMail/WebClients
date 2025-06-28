import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import SignInWithAnotherDeviceQRCode from '@proton/account/signInWithAnotherDevice/SignInWithAnotherDeviceQRCode';
import {
    GiveUpError,
    type SignInWithAnotherDeviceResult,
    signInWithAnotherDevicePull,
} from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePull';
import { Button, ButtonLike } from '@proton/atoms';
import { useLocalState } from '@proton/components';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import metrics from '@proton/metrics/index';
import observeApiError from '@proton/metrics/lib/observeApiError';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { type APP_NAMES, BRAND_NAME, MAIL_APP_NAME, SECOND } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { Paths } from '../../content/helper';
import userExclamation from '../../public/user-exclamation.svg';
import { useGetAccountKTActivation } from '../../useGetAccountKTActivation';
import Content from '../Content';
import Header from '../Header';
import Layout from '../Layout';
import Main from '../Main';
import { defaultPersistentKey, getContinueToString } from '../helper';

interface Props {
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toAppName?: string;
    toApp?: APP_NAMES;
    onStartAuth: () => Promise<void>;
    api: Api;
    paths: Paths;
}

type State =
    | { type: 'init'; qrCode: string }
    | { type: 'error'; errorMessage: string; error: any }
    | { type: 'done' }
    | null;

const SignInWithAnotherDeviceContainer = ({ api, toApp, paths, onLogin, onStartAuth }: Props) => {
    const [result, setResult] = useState<State>(null);
    const { APP_NAME } = useConfig();
    const [persistent] = useLocalState(false, defaultPersistentKey);
    const getKtActivation = useGetAccountKTActivation();
    const errorHandler = useErrorHandler();

    const restartRef = useRef<null | (() => Promise<void>)>(null);

    useEffect(() => {
        const abortController = new AbortController();

        const handleSession = async ({
            session,
            forkDurationTime,
        }: Extract<SignInWithAnotherDeviceResult, { type: 'session' }>['payload']) => {
            metrics.core_edm_pull_total.increment({ status: 'success' });
            metrics.core_edm_pull_histogram.observe({ Value: Math.round(forkDurationTime / SECOND), Labels: {} });
            await metrics.processAllRequests().catch(noop);
            await onLogin({ data: session });
        };

        const initProcess = async () => {
            await onStartAuth().catch(noop);

            metrics.core_edm_pull_total.increment({ status: 'init' });

            const start = signInWithAnotherDevicePull({
                abortController,
                config: {
                    appName: APP_NAME,
                    persistent,
                    ktActivation: await getKtActivation(),
                },
                api: getSilentApi(api),
                onResult: (data) => {
                    if (data.type === 'init') {
                        setResult({ type: 'init', qrCode: data.payload.qrCode });
                    }
                    if (data.type === 'error') {
                        const error = data.payload.error;
                        observeApiError(error, (status) => metrics.core_edm_pull_total.increment({ status }));
                        errorHandler(error, { notify: false });
                        setResult({
                            type: 'error',
                            errorMessage: getNonEmptyErrorMessage(error),
                            error,
                        });
                    }
                    if (data.type === 'session') {
                        setResult({ type: 'done' });
                        handleSession(data.payload).catch((error) => {
                            errorHandler(error, { notify: false });
                            setResult({
                                type: 'error',
                                errorMessage: getNonEmptyErrorMessage(error),
                                error,
                            });
                        });
                    }
                },
            });

            restartRef.current = async () => {
                await onStartAuth().catch(noop);
                return start();
            };

            return start();
        };

        initProcess().catch(noop);

        return () => {
            restartRef.current = null;
            abortController.abort();
        };
    }, []);

    const toAppName = getToAppName(toApp);

    if (result?.type === 'error') {
        return (
            <Layout hasDecoration={true} toApp={toApp}>
                <Main>
                    <Content>
                        <div className="text-center">
                            <div className="mb-6">
                                <img src={userExclamation} alt="" />
                            </div>
                            <div className="h2 text-bold mb-2">
                                {(() => {
                                    if (result.error instanceof GiveUpError) {
                                        return c('edm').t`QR code expired`;
                                    }
                                    return c('Error').t`We couldn't sign you in`;
                                })()}
                            </div>
                            <div className="mb-4 color-weak">
                                <div className="mb-2">{c('edm').t`Try generating a new QR code.`}</div>
                                {(() => {
                                    if (result.error instanceof GiveUpError) {
                                        return null;
                                    }
                                    if (result.errorMessage) {
                                        return <div>Error: {result.errorMessage}</div>;
                                    }
                                })()}
                            </div>
                            <div className="flex flex-column gap-2">
                                <Button
                                    size="large"
                                    onClick={() => {
                                        setResult(null);
                                        restartRef.current?.().catch(noop);
                                    }}
                                    color="norm"
                                    fullWidth
                                >
                                    {c('edm').t`Generate QR code`}
                                </Button>
                                <ButtonLike size="large" as={Link} to={paths.login} fullWidth>
                                    {c('Action').t`Back to sign in`}
                                </ButtonLike>
                            </div>
                        </div>
                    </Content>
                </Main>
            </Layout>
        );
    }

    return (
        <Layout hasDecoration={true} toApp={toApp}>
            <Main>
                <Header
                    title={c('edm').t`Sign in with QR code`}
                    subTitle={toAppName ? getContinueToString(toAppName) : ''}
                />
                <Content>
                    <div className="ui-standard flex justify-center items-center mb-6">
                        <div className="p-4 bg-norm border border-weak rounded-lg lh100">
                            {result?.type === 'init' ? (
                                <SignInWithAnotherDeviceQRCode data={result.qrCode} />
                            ) : (
                                <SkeletonLoader width="9rem" height="9rem" className="bg-primary" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-4">
                        <div className="text-lg text-bold">{c('edm').t`How to sign in using another device`}</div>
                        <ol className="m-0 pl-4">
                            <li className="mb-2">{c('edm')
                                .t`Get another device that’s signed in to your ${BRAND_NAME} Account`}</li>
                            <li className="mb-2">
                                {getBoldFormattedText(
                                    c('edm').t`Using that device, open the ${MAIL_APP_NAME} app and select **Settings**`
                                )}
                            </li>
                            <li className="mb-2">
                                {getBoldFormattedText(c('edm').t`Select **Sign in on another device → Scan QR code**`)}
                            </li>
                            <li className="mb-2">{c('edm').t`Scan the code to sign in`}</li>
                        </ol>

                        <ButtonLike size="large" as={Link} to={paths.login} color="weak" fullWidth>
                            {c('Action').t`Cancel`}
                        </ButtonLike>
                    </div>
                </Content>
            </Main>
        </Layout>
    );
};

export default SignInWithAnotherDeviceContainer;
