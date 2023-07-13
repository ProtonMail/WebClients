import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import { MnemonicData } from '../../signup/interfaces';
import Layout from '../Layout';
import recoveryKit from './recovery-kit.svg';

interface Props {
    logo: ReactNode;
    onContinue: () => Promise<void>;
    mnemonic: MnemonicData;
    onMeasureClick: (type: 'recovery_download' | 'recovery_download_again' | 'recovery_continue') => void;
}

const PDFRecoveryStep = ({ onMeasureClick, logo, onContinue, mnemonic }: Props) => {
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState<0 | 1>(0);

    const size = `(${humanSize(mnemonic.blob.size)})`;

    const handleDownload = () => {
        downloadFile(mnemonic.blob, 'recovery-kit.pdf');
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
                        <img src={recoveryKit} alt="" />
                    </div>
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
                    </div>
                    {step === 0 && (
                        <Button
                            color="norm"
                            size="large"
                            fullWidth
                            className="mt-6"
                            onClick={() => {
                                onMeasureClick('recovery_download');
                                handleDownload();
                                setStep(1);
                            }}
                        >{c('pass_signup_2023: Action').t`Download to continue ${size}`}</Button>
                    )}
                    {step === 1 && (
                        <>
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
                            <Button
                                size="large"
                                fullWidth
                                className="mt-2"
                                color="norm"
                                shape="ghost"
                                onClick={() => {
                                    onMeasureClick('recovery_download_again');
                                    handleDownload();
                                }}
                            >
                                {c('pass_signup_2023: Action').t`Download again ${size}`}
                            </Button>
                        </>
                    )}
                </Content>
            </Main>
        </Layout>
    );
};

export default PDFRecoveryStep;
