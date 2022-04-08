import { c } from 'ttag';
import { Button, useLoading } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import Main from './Main';
import Header from './Header';
import Content from './Content';

interface Props {
    name: string;
    image?: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

const OAuthConfirmForkContainer = ({ name, image, onConfirm, onCancel }: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <Main>
            <Header
                title={
                    // translator: variable here is the name of the service to login to. Complete sentence : "Connect SimpleLogin"
                    c('Title').t`Connect ${name}`
                }
            />
            <Content>
                <p className="mt0 oauth-confirm-fork-details">
                    {
                        // translator: variable here is the name of the service to login to. Complete sentence: "Select Continue to SimpleLogin to open the app. This also creates a SimpleLogin account with your ProtonMail address so you can sign in with one click in the future."
                        c('Info')
                            .t`Select Continue to ${name} to open the app. This also creates a ${name} account with your ${MAIL_APP_NAME} address so you can sign in with one click in the future.`
                    }
                </p>
                {image && <img src={`data:image/svg+xml;base64,${image}`} alt="" className="w100 mb1-5" />}
                <Button
                    className="mb0-5"
                    color="norm"
                    fullWidth
                    size="large"
                    onClick={() => withLoading(onConfirm())}
                    loading={loading}
                >
                    {
                        // translator: variable here is the name of the service to login to. Complete sentence: "Continue to SimpleLogin"
                        c('Action').t`Continue to ${name}`
                    }
                </Button>
                <Button shape="ghost" fullWidth size="large" onClick={onCancel} disabled={loading}>{c('Action')
                    .t`Cancel`}</Button>
            </Content>
        </Main>
    );
};

export default OAuthConfirmForkContainer;
