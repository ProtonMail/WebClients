import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi } from '@proton/components';

import RecoveryStepUnderstoodCheckbox from '../../../containers/recoveryPhrase/RecoveryStepUnderstoodCheckbox';
import SetRecoveryPhraseOnSignupContainer from '../../../containers/recoveryPhrase/SetRecoveryPhraseOnSignupContainer';
import sendRecoveryPhrasePayload from '../../../containers/recoveryPhrase/sendRecoveryPhrasePayload';
import type { DeferredMnemonicData } from '../../../containers/recoveryPhrase/types';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import Main from '../../../public/Main';
import type { AccountData } from '../../../signup/interfaces';

interface Props {
    onContinue: () => void;
    mnemonicData: DeferredMnemonicData;
    accountData: AccountData | undefined | null;
    onMeasureClick: (type: 'recovery_download' | 'recovery_download_again' | 'recovery_continue') => void;
}

const MnemonicRecoveryStep = ({ onContinue, accountData, mnemonicData, onMeasureClick }: Props) => {
    const [understood, setUnderstood] = useState(false);

    const api = useApi();

    return (
        <Main>
            <Content>
                <Header
                    title={c('pass_signup_2023: Title').t`Secure your account`}
                    subTitle={c('pass_signup_2023: Info').t`Save your recovery kit to continue`}
                />
                <SetRecoveryPhraseOnSignupContainer
                    recoveryPhraseData={mnemonicData}
                    sendRecoveryPhrasePayload={() =>
                        sendRecoveryPhrasePayload({
                            api,
                            payload: mnemonicData.payload,
                            password: accountData?.password,
                        })
                    }
                    continueButton={() => {
                        return (
                            <>
                                <RecoveryStepUnderstoodCheckbox
                                    checked={understood}
                                    onChange={() => setUnderstood(!understood)}
                                />
                                <Button
                                    color="norm"
                                    size="large"
                                    fullWidth
                                    disabled={!understood}
                                    onClick={() => {
                                        onMeasureClick('recovery_continue');
                                        onContinue();
                                    }}
                                >
                                    {c('pass_signup_2023: Action').t`Continue`}
                                </Button>
                            </>
                        );
                    }}
                />
            </Content>
        </Main>
    );
};

export default MnemonicRecoveryStep;
