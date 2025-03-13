import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/index';
import { type OnLoginCallback, QRCode, SkeletonLoader } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getForks, pullForkSession } from '@proton/shared/lib/api/auth';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';
import { type APP_NAMES, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Api } from '@proton/shared/lib/interfaces';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import Content from '../Content';
import Header from '../Header';
import Layout from '../Layout';
import Main from '../Main';
import protonQRLogo from './proton-qr-logo.svg';

export const generateRandomBytes = () => {
    const length = 32;
    return crypto.getRandomValues(new Uint8Array(length));
};

const POLL_INTERVAL = 10_000;
const QrCode = ({ selector, userCode, api }: { userCode: string; selector: string; api: Api }) => {
    const base64EncodedRandomBytes = uint8ArrayToBase64String(generateRandomBytes());

    useEffect(() => {
        const fetchData = async () => {
            const { UID, AccessToken, RefreshToken, Payload } = await api<PullForkResponse>(pullForkSession(selector));

            // Decrypt payload with base64EncodedRandomBytes
            // {keyPassword} = resolveForkPasswords
            // persistSession

            // persist - read from local storage

            // onLogin

            // {
            //     "Code": 1000,
            //     "Payload": null,
            //     "LocalID": 0,
            //     "ExpiresIn": 86400,
            //     "TokenType": "Bearer",
            //     "Scope": "full self organization payments keys parent user loggedin paid nondelinquent mail vpn calendar drive docs pass verified settings wallet neutron lumo",
            //     "Scopes": [
            //         "full",
            //         "self",
            //         "organization",
            //         "payments",
            //         "keys",
            //         "parent",
            //         "user",
            //         "loggedin",
            //         "paid",
            //         "nondelinquent",
            //         "mail",
            //         "vpn",
            //         "calendar",
            //         "drive",
            //         "docs",
            //         "pass",
            //         "verified",
            //         "settings",
            //         "wallet",
            //         "neutron",
            //         "lumo"
            //     ],
            //     "UID": "zjqmhxllrf3eza7fm2qp56lebvlhwavj",
            //     "UserID": "vh8ln9w_1EtKti5UiWzfCF9fGMFeTIm9jlEfoRK0hdV_7gnPE54tywkK76ETiX5dKMivQP2sz-PdXPOzLjU8Gg==",
            //     "AccessToken": "attzxgkpzxbusyhhpzvtyn7cebfesh6n",
            //     "RefreshToken": "tqqlxnrhakngiy6bamhm2zr25tur6xqq"
            // }

            return { UID };
        };

        const interval = setInterval(() => {
            void fetchData()
                .then(({ UID }) => {
                    console.log('UID', UID);
                    // TODO: create session etc

                    // const authApi = getAuthAPI(UID, AccessToken, silentApi);
                    // await api(
                    //     withAuthHeaders(
                    //         UID,
                    //         newAccessToken,
                    //         setCookies({
                    //             Persistent: false,
                    //             UID,
                    //             RefreshToken,
                    //             State: getRandomString(24),
                    //         })
                    //     )
                    // );
                })
                .catch((err) => {
                    console.log(err);
                });
        }, POLL_INTERVAL);

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const qrCodeData = `${userCode}:${base64EncodedRandomBytes}:web-account`; // TODO: app_name

    return (
        <>
            <QRCode
                className="bg-norm flex w-custom fade-in"
                style={{ '--w-custom': '9rem' }}
                value={qrCodeData}
                fgColor="#15006F"
                imageSettings={{
                    src: protonQRLogo,
                    height: 44,
                    width: 44,
                    excavate: false,
                }}
            />
            {/* {qrCodeData} */}
        </>
    );
};

interface Props {
    onLogin: OnLoginCallback;
    onUsed: () => void;
    productParam: ProductParam;
    toAppName?: string;
    toApp?: APP_NAMES;
    onPreSubmit?: () => Promise<void>;
    onPreload?: () => void;
    api: Api;
    unauthenticatedApi: UnauthenticatedApi;
}

const SignInWithAnotherDeviceContainer = ({
    api,
    unauthenticatedApi,
    onPreload,
    onPreSubmit,
    onLogin,
    onUsed,
    toApp,
    productParam,
}: Props) => {
    const [forkResponse, setForkResponse] = useState<{ Selector: string; UserCode: string }>();

    useEffect(() => {
        const run = async () => {
            const forkResponse = await api<{ Selector: string; UserCode: string }>(getForks());
            setForkResponse(forkResponse);
        };

        void run();
    }, []);

    const toAppName = getToAppName(toApp);

    return (
        <Layout hasDecoration={true} toApp={toApp}>
            <Main>
                <Header
                    title={c('Title').t`Sign in with another device`}
                    subTitle={toAppName && c('Title').t`to continue to ${toAppName}`}
                />
                <Content>
                    <div className="ui-standard flex justify-center items-center mb-6">
                        <div className="p-4 bg-norm border border-weak rounded-lg lh100">
                            {forkResponse ? (
                                <QrCode api={api} selector={forkResponse.Selector} userCode={forkResponse.UserCode} />
                            ) : (
                                <SkeletonLoader width={'9rem'} height={'9rem'} className="bg-primary" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-4">
                        <p className="m-0">
                            {c('Info')
                                .t`Scan this QR code in the ${BRAND_NAME} app on your phone to sign in instantly.`}{' '}
                            <a href={getKnowledgeBaseUrl('/')} target="_blank">
                                {c('Action').t`Learn more`}
                            </a>
                        </p>
                        <ol className="m-0 pl-4">
                            <li className="mb-2">{c('Info').t`Open the ${BRAND_NAME} app on your phone`}</li>
                            <li className="mb-2">
                                {getBoldFormattedText(
                                    c('Info').t`Tap into **Settings**, then tap **Sign in to another device**`
                                )}
                            </li>
                            <li className="mb-2">{getBoldFormattedText(c('Info').t`Tap **Scan QR code**`)}</li>
                        </ol>

                        <ButtonLike as={Link} to={SSO_PATHS.LOGIN} color="weak" fullWidth>
                            {c('Action').t`Cancel`}
                        </ButtonLike>
                    </div>
                </Content>
            </Main>
        </Layout>
    );
};

export default SignInWithAnotherDeviceContainer;

/*
const emulateQrCodeScan = async ({ UserCode }) => {
    await fetch(`${window.location.origin}/api/auth/sessions/forks`, {
        headers: {
            'content-type': 'application/json',
            'x-pm-appversion': 'web-account@5.0.999.999',
            'x-pm-uid': JSON.parse(window.localStorage.getItem(`ps-${window.location.pathname.match(/(\d+)/)[1]}`))
                .UID,
        },
        body: JSON.stringify({
            ChildClientID: 'web-account',
            Independent: 0,
            UserCode,
        }),
        method: 'POST',
        credentials: 'include',
    }).then((x) => x.json());
};
await emulateQrCodeScan({UserCode: ''});
*/
