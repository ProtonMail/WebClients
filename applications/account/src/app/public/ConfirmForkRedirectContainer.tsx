import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import { PublicAppContext } from '../content/state-machine/PublicAppContext';
import { type ConsentState, selectLoggingIn, selectPreAppIntent } from '../content/state-machine/publicAppStateMachine';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

interface Props {
    consent: Extract<ConsentState, { type: 'fork-redirect-consent' }>;
}

const ConfirmForkRedirectContainer = ({ consent }: Props) => {
    const publicApp = PublicAppContext.useActorRef();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const loading = PublicAppContext.useSelector(selectLoggingIn);
    const { redirectUrl } = consent.payload;
    const onConfirm = () => publicApp.send({ type: 'consent.confirmed', consent });
    const onCancel = () => {
        window.location.pathname = SSO_PATHS.SWITCH;
    };
    return (
        <Layout hasDecoration={false} toApp={toApp}>
            <Main>
                <Header title={c('Title').t`Confirm where to sign in`} />
                <Content>
                    <Text>{c('Info').t`You're about to sign in to your ${BRAND_NAME} Account at this address:`}</Text>
                    <p className="color-norm bg-weak p-4 rounded-lg w-full mt-0 mb-6 text-break user-select">
                        {redirectUrl}
                    </p>
                    <Text>
                        {c('Info')
                            .t`Whoever controls this address would get full access to your account and your data. Only continue if you recognize it and started this yourself.`}
                    </Text>
                    <Button
                        className="mb-2"
                        color="danger"
                        fullWidth
                        size="large"
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {c('Action').t`Continue`}
                    </Button>
                    <Button shape="ghost" color="norm" fullWidth size="large" onClick={onCancel} disabled={loading}>
                        {c('Action').t`Cancel`}
                    </Button>
                </Content>
            </Main>
        </Layout>
    );
};

export default ConfirmForkRedirectContainer;
