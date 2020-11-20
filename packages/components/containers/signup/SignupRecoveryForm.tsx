import React, { useRef, useState, ChangeEvent, FormEvent } from 'react';
import { c } from 'ttag';
import { validateEmail } from 'proton-shared/lib/api/core/validate';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import {
    Alert,
    EmailInput,
    LinkButton,
    PrimaryButton,
    IntlTelInput,
    ConfirmModal,
    Challenge,
    Label,
    FullLoader,
    InlineLinkButton,
} from '../../components';
import { useModals, useLoading, useApi } from '../../hooks';
import { SignupModel, SignupErrors } from './interfaces';
import { SIGNUP_STEPS } from './constants';
import { ChallengeRef, ChallengeResult } from '../../components/challenge/ChallengeFrame';
import SignupLabelInputRow from './SignupLabelInputRow';
import SignupSubmitRow from './SignupSubmitRow';

interface Props {
    model: SignupModel;
    onChange: (model: SignupModel) => void;
    onSubmit: (payload?: ChallengeResult) => void;
    onSkip: (payload?: ChallengeResult) => void;
    errors: SignupErrors;
    loading: boolean;
}

const { RECOVERY_EMAIL, RECOVERY_PHONE } = SIGNUP_STEPS;

const SignupRecoveryForm = ({ model, onChange, onSubmit, onSkip, errors, loading }: Props) => {
    const api = useApi();
    const formRef = useRef<HTMLFormElement>(null);
    const [challengeLoading, setChallengeLoading] = useState(true);
    const { createModal } = useModals();
    const challengeRefRecovery = useRef<ChallengeRef>();
    const [loadingChallenge, withLoadingChallenge] = useLoading();
    const disableSubmit = model.step === RECOVERY_EMAIL ? !!errors.recoveryEmail : !!errors.recoveryPhone;
    const [recoveryEmailError, setRecoveryEmailError] = useState('');

    const handleChangePhone = (status: any, value: any, countryData: any, number: string) => {
        onChange({ ...model, recoveryPhone: number });
    };

    const handleSkip = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Warning`} onConfirm={resolve} onClose={reject}>
                    <Alert type="warning">{c('Info')
                        .t`You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?`}</Alert>
                </ConfirmModal>
            );
        });
        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            return onSkip(payload);
        }
        onSkip();
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            try {
                await api(validateEmail(model.recoveryEmail));
                setRecoveryEmailError('');
            } catch (error) {
                setRecoveryEmailError(getApiErrorMessage(error) || c('Error').t`Can't validate email, try again later`);
                throw error;
            }
            return onSubmit(payload);
        }
        onSubmit();
    };

    const handleChallengeLoaded = () => setChallengeLoading(false);

    const inner = (() => {
        if (model.step === RECOVERY_EMAIL) {
            const challenge = (
                <Challenge
                    bodyClassName="signLayout-container"
                    challengeRef={challengeRefRecovery}
                    type={1}
                    onLoaded={handleChallengeLoaded}
                >
                    <div>
                        <EmailInput
                            id="recovery-email"
                            name="recovery-email"
                            autoFocus
                            autoComplete="on"
                            error={recoveryEmailError}
                            autoCapitalize="off"
                            autoCorrect="off"
                            value={model.recoveryEmail}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                                onChange({ ...model, recoveryEmail: target.value });
                                setRecoveryEmailError('');
                            }}
                            onKeyDown={({ keyCode }: React.KeyboardEvent<HTMLInputElement>) =>
                                keyCode === 13 && formRef.current?.submit()
                            }
                            required
                        />
                    </div>
                    <div>
                        <InlineLinkButton
                            className="mt0-25"
                            id="recovery-phone-button"
                            onClick={() => onChange({ ...model, recoveryEmail: '', step: RECOVERY_PHONE })}
                        >{c('Action').t`Add a recovery phone number instead`}</InlineLinkButton>
                    </div>
                </Challenge>
            );

            return (
                <SignupLabelInputRow
                    label={<Label htmlFor="recovery-email">{c('Label').t`Recovery email`}</Label>}
                    input={challenge}
                />
            );
        }

        if (model.step === RECOVERY_PHONE) {
            return (
                <SignupLabelInputRow
                    label={<Label htmlFor="recovery-phone">{c('Label').t`Recovery phone`}</Label>}
                    input={
                        <>
                            <div>
                                <IntlTelInput
                                    id="recovery-phone"
                                    name="recovery-phone"
                                    containerClassName="w100"
                                    inputClassName="w100"
                                    autoFocus
                                    onPhoneNumberChange={handleChangePhone}
                                    required
                                />
                            </div>
                            <div>
                                <InlineLinkButton
                                    className="mt0-25"
                                    onClick={() => onChange({ ...model, recoveryPhone: '', step: RECOVERY_EMAIL })}
                                >{c('Action').t`Add an email address instead`}</InlineLinkButton>
                            </div>
                        </>
                    }
                />
            );
        }
    })();

    return (
        <>
            {model.step === RECOVERY_EMAIL && challengeLoading ? (
                <div className="aligncenter">
                    <FullLoader className="color-primary" size={200} />
                </div>
            ) : null}
            <form
                name="recoveryForm"
                className="signup-form"
                onSubmit={(e) => withLoadingChallenge(handleSubmit(e))}
                hidden={model.step === RECOVERY_EMAIL && challengeLoading}
                ref={formRef}
            >
                {inner}
                <SignupSubmitRow>
                    <LinkButton
                        className="mr2 onmobile-mr0 pm-button--large"
                        disabled={loading || loadingChallenge}
                        onClick={handleSkip}
                    >{c('Action').t`Skip`}</LinkButton>
                    <PrimaryButton
                        className="pm-button--large"
                        loading={loading || loadingChallenge}
                        disabled={disableSubmit}
                        type="submit"
                    >{c('Action').t`Next`}</PrimaryButton>
                </SignupSubmitRow>
            </form>
        </>
    );
};

export default SignupRecoveryForm;
