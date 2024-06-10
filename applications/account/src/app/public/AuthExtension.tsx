import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import type { ExtensionForkResult, ExtensionForkResultPayload } from '@proton/shared/lib/authentication/fork/extension';
import { type ExtensionApp, sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS } from '@proton/shared/lib/constants';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import successImg from '@proton/styles/assets/img/onboarding/proton-welcome.svg';
import noop from '@proton/utils/noop';

import Content from './Content';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

export type AuthExtensionState = ExtensionForkResult & { app: ExtensionApp | undefined };

const assets = require.context(`@proton/styles/assets/img/extension`, true, /.svg$/);

const getAssetsForExtension = (appName: ExtensionApp): { [key in AuthExtensionState['type']]: string } => ({
    success: assets(`./${appName}/success.svg`),
    error: assets(`./${appName}/error.svg`),
});

const getExtensionAssets = (app?: ExtensionApp): { [key in AuthExtensionState['type']]: string } => {
    switch (app) {
        case APPS.PROTONPASSBROWSEREXTENSION:
        case APPS.PROTONEXTENSION:
            return getAssetsForExtension(APPS.PROTONPASSBROWSEREXTENSION);
        case APPS.PROTONVPNBROWSEREXTENSION:
            return getAssetsForExtension(APPS.PROTONVPNBROWSEREXTENSION);
        default:
            return { success: successImg, error: errorImg };
    }
};

const getDefaults = (): { [key in AuthExtensionState['type']]: ExtensionForkResultPayload } => ({
    success: {
        title: c('Title').t`Signed in successfully!`,
        message: c('Info').t`You may now start using the extension`,
    },
    error: {
        title: c('Error message').t`Oops, something went wrong`,
        message: c('Info').t`An error occurred while communicating with the extension`,
    },
});

const getDefaultState = (defaults: ReturnType<typeof getDefaults>): AuthExtensionState => ({
    type: 'error',
    payload: defaults.error,
    app: undefined,
});

const AuthExtension = () => {
    const location = useLocation<AuthExtensionState | undefined>();
    const defaults = getDefaults();
    const { type, payload, app } = location.state ?? getDefaultState(defaults);
    const errorDetail = location.state?.type === 'error' && location.state.error;
    const logo = getExtensionAssets(app)?.[type];

    useEffect(() => {
        /* notify the extension that we have reached the `/auth-ext`
         * page - it may want to intercept this and redirect to an
         * extension specific page */
        if (app !== undefined && type === 'success') {
            sendExtensionMessage({ type: 'auth-ext' }, { app }).catch(noop);
        }
    }, [app]);

    const defaultData = defaults[type] || defaults.error;

    return (
        <Layout hasDecoration={false}>
            <Main>
                <Content className="text-center">
                    {logo && (
                        <div className="text-center my-8">
                            <img className="m-auto w-custom" style={{ '--w-custom': '9.375rem' }} src={logo} alt="" />
                        </div>
                    )}
                    <h1 className="h3 text-bold mb-0 mt-2 md:mt-0">{payload?.title ?? defaultData.title}</h1>
                    <Text className="mt-4">
                        {payload?.message ?? defaultData.message}
                        {errorDetail && ` (${errorDetail})`}
                    </Text>
                </Content>
            </Main>
        </Layout>
    );
};

export default AuthExtension;
