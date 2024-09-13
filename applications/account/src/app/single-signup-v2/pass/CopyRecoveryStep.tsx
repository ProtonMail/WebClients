import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Card } from '@proton/atoms/Card';
import { Copy } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import type { MnemonicData } from '../../signup/interfaces';
import RecoveryStepUnderstoodCheckbox from './RecoveryStepUnderstoodCheckbox';

interface Props {
    onContinue: () => Promise<void>;
    mnemonic: MnemonicData;
    onMeasureClick: (type: 'recovery_continue' | 'recovery_download') => void;
}

const CopyRecoveryStep = ({ onMeasureClick, onContinue, mnemonic }: Props) => {
    const [loading, withLoading] = useLoading();
    const onceRef = useRef(false);
    const [understood, setUnderstood] = useState(false);

    const { createNotification } = useNotifications();

    const onCopy = () => {
        if (!onceRef.current) {
            onMeasureClick('recovery_download');
            onceRef.current = true;
        }
        createNotification({ text: c('Info').t`Recovery kit copied to clipboard` });
    };

    return (
        <Main>
            <Content>
                <Header
                    title={c('pass_signup_2023: Title').t`Secure your account`}
                    subTitle={c('pass_signup_2023: Info').t`Save your recovery kit to continue`}
                />
                <div>
                    <p className="mt-4">
                        {getBoldFormattedText(
                            c('pass_signup_2023: Info')
                                .t`If you get locked out of your ${BRAND_NAME} Account, your **Recovery kit** will allow you to sign in and recover your data.`
                        )}
                    </p>
                    <p className="mb-0">
                        {getBoldFormattedText(
                            c('pass_signup_2023: Info')
                                .t`It’s the only way to fully restore your account, so make sure you keep it somewhere safe.`
                        )}
                    </p>
                    <Card className="mt-2 flex justify-space-between items-center flex-nowrap" bordered={false} rounded>
                        <span className="mr-2 text-bold" data-testid="account:recovery:generatedRecoveryPhrase">
                            {mnemonic.mnemonic}
                        </span>
                        <Copy className="bg-norm shrink-0" value={mnemonic.mnemonic} onCopy={onCopy} />
                    </Card>

                    <RecoveryStepUnderstoodCheckbox
                        className="mt-2"
                        checked={understood}
                        onChange={loading ? noop : () => setUnderstood(!understood)}
                    />
                </div>
                <Button
                    color="norm"
                    size="large"
                    fullWidth
                    className="mt-4"
                    disabled={!understood}
                    loading={loading}
                    onClick={() => {
                        onMeasureClick('recovery_continue');
                        void withLoading(onContinue());
                    }}
                >
                    {c('pass_signup_2023: Action').t`Continue`}
                </Button>
            </Content>
        </Main>
    );
};

export default CopyRecoveryStep;
