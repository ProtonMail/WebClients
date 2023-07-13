import { ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Copy } from '@proton/components/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import { MnemonicData } from '../../signup/interfaces';
import Layout from '../Layout';

interface Props {
    logo: ReactNode;
    onContinue: () => Promise<void>;
    mnemonic: MnemonicData;
    onMeasureClick: (type: 'recovery_continue' | 'recovery_download') => void;
}

const CopyRecoveryStep = ({ onMeasureClick, logo, onContinue, mnemonic }: Props) => {
    const [loading, withLoading] = useLoading();
    const onceRef = useRef(false);

    const { createNotification } = useNotifications();

    const onCopy = () => {
        if (!onceRef.current) {
            onMeasureClick('recovery_download');
            onceRef.current = true;
        }
        createNotification({ text: c('Info').t`Recovery kit copied to clipboard` });
    };

    return (
        <Layout logo={logo} hasDecoration={false}>
            <Main>
                <Content>
                    <Header
                        center
                        title={c('pass_signup_2023: Title').t`Secure your account`}
                        subTitle={c('pass_signup_2023: Info').t`Save your recovery kit to continue`}
                    />
                    <div>
                        <p className="mt-4">
                            {getBoldFormattedText(
                                c('pass_signup_2023: Info')
                                    .t`If you get locked out of your ${BRAND_NAME} Account, your **recovery kit** will allow you to sign in and recover your data.`
                            )}
                        </p>
                        <p className="mb-0">
                            {getBoldFormattedText(
                                c('pass_signup_2023: Info')
                                    .t`It’s the only way to fully restore your account, so make sure you keep this **recovery kit** somewhere safe.`
                            )}
                        </p>
                        <Card
                            className="mt-2 flex flex-justify-space-between flex-align-items-center flex-nowrap"
                            bordered={false}
                            rounded
                        >
                            <span className="mr-2 text-bold" data-testid="account:recovery:generatedRecoveryPhrase">
                                {mnemonic.mnemonic}
                            </span>
                            <Copy className="bg-norm flex-item-noshrink" value={mnemonic.mnemonic} onCopy={onCopy} />
                        </Card>
                    </div>
                    <Button
                        color="norm"
                        size="large"
                        fullWidth
                        className="mt-6"
                        loading={loading}
                        onClick={() => {
                            onMeasureClick('recovery_continue');
                            withLoading(onContinue());
                        }}
                    >
                        {c('pass_signup_2023: Action').t`Continue`}
                    </Button>
                </Content>
            </Main>
        </Layout>
    );
};

export default CopyRecoveryStep;
