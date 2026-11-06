import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { continueToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { PublicAppContext } from '../content/state-machine/PublicAppContext';
import { type ConsentState, selectLoggingIn, selectToAppName } from '../content/state-machine/publicAppStateMachine';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

interface Props {
    consent: Extract<ConsentState, { type: 'oauth-consent' }>;
}

const OAuthConfirmForkContainer = ({ consent }: Props) => {
    const publicApp = PublicAppContext.useActorRef();
    const name = PublicAppContext.useSelector(selectToAppName) || '';
    const loading = PublicAppContext.useSelector(selectLoggingIn);
    const image = consent.payload.data.payload.oauthData.clientInfo.Logo;
    const onConfirm = () => publicApp.send({ type: 'consent.confirmed', consent });
    const onCancel = () => {
        // Force a hard refresh to get active sessions to refresh when signing up
        window.location.pathname = SSO_PATHS.SWITCH;
    };
    const children = (
        <Main>
            <Header
                title={
                    // translator: variable here is the name of the service to login to. Complete sentence : "Connect SimpleLogin"
                    c('Title').t`Connect ${name}`
                }
            />
            <Content>
                <Text>
                    {
                        // translator: variable here is the name of the service to login to. Continuing will connect your Proton Account to SimpleLogin.
                        c('Info').t`Continuing will connect your ${BRAND_NAME} Account to ${name}.`
                    }
                </Text>
                {image && <img src={`data:image/svg+xml;base64,${image}`} alt="" className="w-full mb-6" />}
                <Button className="mb-2" color="norm" fullWidth size="large" onClick={onConfirm} loading={loading}>
                    {continueToPlanOrAppNameText(name)}
                </Button>
                <Button shape="ghost" color="norm" fullWidth size="large" onClick={onCancel} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
            </Content>
        </Main>
    );
    return (
        <Layout hasDecoration={false} toApp={undefined}>
            {children}
        </Layout>
    );
};

export default OAuthConfirmForkContainer;
