import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import Content from '../../../public/Content';
import Header from '../../../public/Header';
import Main from '../../../public/Main';
import { type DeferredMnemonicData } from '../../../signup/interfaces';
import { sendMnemonicPayloadToBackend } from '../../../signup/signupActions';
import RecoveryKitAction from './RecoveryKitAction';
import RecoveryStepUnderstoodCheckbox from './RecoveryStepUnderstoodCheckbox';

interface Props {
    onContinue: () => void;
    mnemonicData: DeferredMnemonicData;
    onMeasureClick: (type: 'recovery_download' | 'recovery_download_again' | 'recovery_continue') => void;
}

const MnemonicRecoveryStep = ({ onContinue, mnemonicData, onMeasureClick }: Props) => {
    const [understood, setUnderstood] = useState(false);
    const api = useApi();

    const setApiRecoveryPhrase = async () => {
        await sendMnemonicPayloadToBackend({ api, payload: mnemonicData.payload });
    };

    return (
        <Main>
            <Content>
                <Header
                    title={c('pass_signup_2023: Title').t`Secure your account`}
                    subTitle={c('pass_signup_2023: Info').t`Save your recovery kit to continue`}
                />
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

                <RecoveryKitAction
                    className="mt-4"
                    mnemonicData={mnemonicData}
                    setApiRecoveryPhrase={setApiRecoveryPhrase}
                />

                <RecoveryStepUnderstoodCheckbox
                    className="mt-2"
                    checked={understood}
                    onChange={() => setUnderstood(!understood)}
                />
                <Button
                    color="norm"
                    size="large"
                    fullWidth
                    className="mt-4"
                    disabled={!understood}
                    onClick={() => {
                        onMeasureClick('recovery_continue');
                        onContinue();
                    }}
                >
                    {c('pass_signup_2023: Action').t`Continue`}
                </Button>
            </Content>
        </Main>
    );
};

export default MnemonicRecoveryStep;
