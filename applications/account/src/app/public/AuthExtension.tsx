import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { getExtension } from '@proton/shared/lib/apps/helper';
import { Extension } from '@proton/shared/lib/authentication/ForkInterface';
import { ExtensionForkResult, ExtensionForkResultPayload } from '@proton/shared/lib/authentication/sessionForking';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import successImg from '@proton/styles/assets/img/onboarding/proton-welcome.svg';

import Content from './Content';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

export type AuthExtensionState = { extension: Extension | undefined } & ExtensionForkResult;

const assets = require.context(`@proton/styles/assets/img/extension`, true, /.svg$/);

const getAssetsForExtension = (appName: APP_NAMES): { [key in AuthExtensionState['type']]: string } => ({
    success: assets(`./${appName}/success.svg`),
    error: assets(`./${appName}/error.svg`),
});

const getExtensionAssets = (extension?: Extension): { [key in AuthExtensionState['type']]: string } => {
    switch (extension) {
        case getExtension(APPS.PROTONEXTENSION):
            return getAssetsForExtension(APPS.PROTONEXTENSION);
        case getExtension(APPS.PROTONVPNBROWSEREXTENSION):
            return getAssetsForExtension(APPS.PROTONVPNBROWSEREXTENSION);
        default:
            return {
                success: successImg,
                error: errorImg,
            };
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
    extension: undefined,
});

const AuthExtension = () => {
    const location = useLocation<AuthExtensionState | undefined>();
    const defaults = getDefaults();
    const { type, payload, extension } = location.state ?? getDefaultState(defaults);
    const logo = getExtensionAssets(extension)?.[type];

    return (
        <Layout hasDecoration={false}>
            <Main>
                <div className="p2 on-mobile-p1 text-center">
                    <Content>
                        {logo && (
                            <div className="text-center my2">
                                <img className="mauto w150p" src={logo} />
                            </div>
                        )}

                        <h3 className="text-bold mb0 on-mobile-mt0-5">{payload?.title ?? defaults[type].title}</h3>
                        <Text className="mt1">{payload?.message ?? defaults[type].message}</Text>
                    </Content>
                </div>
            </Main>
        </Layout>
    );
};

export default AuthExtension;
