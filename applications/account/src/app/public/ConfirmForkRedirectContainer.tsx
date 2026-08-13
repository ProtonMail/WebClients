import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

interface Props {
    redirectUrl: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    toApp?: APP_NAMES;
}

const ConfirmForkRedirectContainer = ({ toApp, redirectUrl, onConfirm, onCancel }: Props) => {
    const [loading, withLoading] = useLoading();

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
                        onClick={() => withLoading(onConfirm())}
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
