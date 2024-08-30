import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME, RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import noop from '@proton/utils/noop';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import type { MnemonicData } from '../../signup/interfaces';
import RecoveryStepUnderstoodCheckbox from './RecoveryStepUnderstoodCheckbox';
import recoveryKit from './recovery-kit.svg';

export interface PDFRecoveryProps {
    onContinue: () => Promise<void>;
    mnemonic: MnemonicData;
    onMeasureClick: (type: 'recovery_download' | 'recovery_download_again' | 'recovery_continue') => void;
}

const PDFRecoveryStep = ({ onMeasureClick, onContinue, mnemonic }: PDFRecoveryProps) => {
    const [loading, withLoading] = useLoading();
    const onceRef = useRef(false);
    const [understood, setUnderstood] = useState(false);

    const size = `(${humanSize({ bytes: mnemonic.blob.size })})`;

    const handleDownload = () => {
        if (onceRef.current) {
            onMeasureClick('recovery_download_again');
        } else {
            onMeasureClick('recovery_download');
            onceRef.current = true;
        }

        downloadFile(mnemonic.blob, RECOVERY_KIT_FILE_NAME);
    };

    return (
        <Main>
            <Content>
                <Header
                    title={c('pass_signup_2023: Title').t`Secure your account`}
                    subTitle={c('pass_signup_2023: Info').t`Save your recovery kit to continue`}
                />
                <div>
                    <img src={recoveryKit} alt="" />
                </div>
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

                    <Button color="norm" shape="ghost" className="mt-4" onClick={handleDownload}>
                        <Icon name="arrow-down-line" className="mr-2" />
                        {c('pass_signup_2023: Action').t`Download PDF ${size}`}
                    </Button>
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

export default PDFRecoveryStep;
