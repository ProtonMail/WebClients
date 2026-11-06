import { useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { useMachine } from '@xstate/react';
import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import SignInWithAnotherDeviceQRCode from '@proton/account/signInWithAnotherDevice/SignInWithAnotherDeviceQRCode';
import { GiveUpError } from '@proton/account/signInWithAnotherDevice/signInWithAnotherDevicePull';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import metrics from '@proton/metrics/metricsInstance';
// eslint-disable-next-line proton/restricted-imports
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import type { OnLoginCallback } from '../../content/authSession';
import { usePublicAppAuth } from '../../content/publicAppAuth';
import { PublicAppContext } from '../../content/state-machine/PublicAppContext';
import { usePublicAppServices } from '../../content/state-machine/PublicAppServices';
import { selectPaths, selectPreAppIntent } from '../../content/state-machine/publicAppStateMachine';
import { runLogin } from '../../content/state-machine/runLogin';
import userExclamation from '../../public/user-exclamation.svg';
import { useGetAccountKTActivation } from '../../useGetAccountKTActivation';
import Content from '../Content';
import Header from '../Header';
import Layout from '../Layout';
import Main from '../Main';
import { getContinueToString } from '../helper';
import { createSignInWithAnotherDeviceActors } from './signInWithAnotherDeviceActors';
import { selectQrCode, signInWithAnotherDeviceStateMachine } from './signInWithAnotherDeviceStateMachine';

const SignInWithAnotherDeviceContainer = () => {
    const services = usePublicAppServices();
    const { onStartAuth } = usePublicAppAuth();
    const publicApp = PublicAppContext.useActorRef();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);
    const { APP_NAME } = useConfig();
    const getKtActivation = useGetAccountKTActivation();
    const errorHandler = useErrorHandler();
    const [snapshot, send, actorRef] = useMachine(
        signInWithAnotherDeviceStateMachine.provide({
            actors: createSignInWithAnotherDeviceActors({
                api: getSilentApi(services.api),
                appName: APP_NAME,
                getKtActivation,
                startAuthSession: onStartAuth,
                login: onLogin,
            }),
        })
    );
    const qrCode = selectQrCode(snapshot);
    const error = snapshot.context.error;

    // Once per visit: a new QR code after one expires is the same attempt
    useEffect(() => {
        metrics.core_edm_pull_total.increment({ status: 'init' });
    }, []);

    useEffect(() => {
        const subscription = actorRef.on('signIn.failed', (event) => errorHandler(event.error, { notify: false }));
        return () => subscription.unsubscribe();
    }, [actorRef, errorHandler]);

    const history = useHistory();
    const backToSignIn = () => history.push(paths.login);

    const toAppName = getToAppName(toApp);

    if (snapshot.matches('failed')) {
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
                                    if (error instanceof GiveUpError) {
                                        return c('edm').t`QR code expired`;
                                    }
                                    return c('Error').t`We couldn't sign you in`;
                                })()}
                            </div>
                            <div className="mb-4 color-weak">
                                <div className="mb-2">{c('edm').t`Try generating a new QR code.`}</div>
                                {(() => {
                                    if (error instanceof GiveUpError) {
                                        return null;
                                    }
                                    const errorMessage = getNonEmptyErrorMessage(error);
                                    if (errorMessage) {
                                        return <div>Error: {errorMessage}</div>;
                                    }
                                })()}
                            </div>
                            <div className="flex flex-column gap-2">
                                <Button
                                    size="large"
                                    onClick={() => send({ type: 'qrCode.requested' })}
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
        <Layout hasDecoration={true} toApp={toApp} onBack={backToSignIn}>
            <Main>
                <Header
                    title={c('edm').t`Sign in with QR code`}
                    subTitle={toAppName ? getContinueToString(toAppName) : ''}
                    onBack={backToSignIn}
                />
                <Content>
                    <div className="ui-standard flex justify-center items-center mb-6 bg-elevated">
                        <div className="p-4 border border-weak rounded-lg lh100" style={{ backgroundColor: 'white' }}>
                            {qrCode ? (
                                <SignInWithAnotherDeviceQRCode data={qrCode} />
                            ) : (
                                <SkeletonLoader width="9rem" height="9rem" className="bg-primary" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-4">
                        <div className="text-lg text-bold">{c('edm').t`How to sign in using another device`}</div>
                        <div>
                            <ol className="m-0 pl-4">
                                <li className="mb-2">{c('edm')
                                    .t`Get another device that’s signed in to your ${BRAND_NAME} Account`}</li>
                                <li className="mb-2">
                                    {getBoldFormattedText(
                                        c('edm')
                                            .t`Using that device, open the ${MAIL_APP_NAME} app and select **Settings**`
                                    )}
                                </li>
                                <li className="mb-2">
                                    {getBoldFormattedText(
                                        c('edm').t`Select **Sign in on another device → Scan QR code**`
                                    )}
                                </li>
                                <li className="mb-2">{c('edm').t`Scan the code to sign in`}</li>
                            </ol>
                            <Href href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link').t`Learn more`}</Href>
                        </div>
                        <ButtonLike size="large" as={Link} to={paths.reset} color="weak" fullWidth>
                            {c('Action').t`I don’t have my phone`}
                        </ButtonLike>
                    </div>
                </Content>
            </Main>
        </Layout>
    );
};

export default SignInWithAnotherDeviceContainer;
