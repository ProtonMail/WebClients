import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { validateEmail, validatePhone } from 'proton-shared/lib/api/core/validate';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { noop } from 'proton-shared/lib/helpers/function';

import {
    Button,
    Challenge,
    useModals,
    useLoading,
    useApi,
    Tabs,
    useFormErrors,
    Icons,
    ConfirmModal,
    PhoneInput,
    InputFieldTwo,
    DefaultThemeInjector,
} from 'react-components';
import { ChallengeRef, ChallengeResult } from 'react-components/components/challenge/ChallengeFrame';
import { SignupModel, SIGNUP_STEPS } from './interfaces';
import Loader from './Loader';

const { RECOVERY_EMAIL, RECOVERY_PHONE } = SIGNUP_STEPS;

interface Props {
    model: SignupModel;
    onChange: (model: Partial<SignupModel>) => void;
    onSubmit: (payload?: ChallengeResult) => void;
    onSkip: (payload?: ChallengeResult) => void;
    defaultCountry?: string;
}

const RecoveryForm = ({ model, onChange, onSubmit, onSkip, defaultCountry }: Props) => {
    const api = useApi();
    const formRef = useRef<HTMLFormElement>(null);
    const [challengeLoading, setChallengeLoading] = useState(true);
    const { createModal } = useModals();
    const challengeRefRecovery = useRef<ChallengeRef>();
    const [loading, withLoading] = useLoading();
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const getOnChange = (field: keyof SignupModel) => (value: string) => onChange({ [field]: value });

    const setRecoveryPhone = getOnChange('recoveryPhone');
    const setRecoveryEmail = getOnChange('recoveryEmail');

    const handleSkip = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Warning`} onConfirm={resolve} onClose={reject} mode="alert">
                    {c('Info')
                        .t`You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?`}
                </ConfirmModal>
            );
        });
        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            return onSkip(payload);
        }
        onSkip();
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (model.step === RECOVERY_EMAIL) {
            const payload = await challengeRefRecovery.current?.getChallenge();
            try {
                await api(validateEmail(model.recoveryEmail));
                return onSubmit(payload);
            } catch (error) {
                setEmailError(getApiErrorMessage(error) || c('Error').t`Can't validate email, try again later`);
                throw error;
            }
        }

        if (model.step === RECOVERY_PHONE) {
            try {
                await api(validatePhone(model.recoveryPhone));
                return onSubmit();
            } catch (error) {
                setPhoneError(getApiErrorMessage(error) || c('Error').t`Can't validate phone, try again later`);
                throw error;
            }
        }
    };

    const handleChallengeLoaded = () => {
        setChallengeLoading(false);
    };

    return (
        <>
            {model.step === RECOVERY_EMAIL && challengeLoading ? (
                <div className="text-center">
                    <Loader />
                </div>
            ) : null}
            <form
                name="recoveryForm"
                className="signup-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleSubmit()).catch(noop);
                }}
                style={
                    model.step === RECOVERY_EMAIL && challengeLoading
                        ? {
                              position: 'absolute',
                              top: '-1000px',
                              left: '-1000px',
                          }
                        : undefined
                }
                ref={formRef}
                method="post"
            >
                <Tabs
                    value={model.step === RECOVERY_EMAIL ? 0 : model.step === RECOVERY_PHONE ? 1 : 0}
                    tabs={[
                        {
                            title: c('Label').t`Email`,
                            content: (
                                <>
                                    <div className="mb1-75">
                                        {c('Info')
                                            .t`We will send you a recovery link to this email address if you forget your password or get locked out of your account.`}
                                    </div>
                                </>
                            ),
                        },
                        {
                            title: c('Label').t`Phone`,
                            content: (
                                <>
                                    <div className="mb1-75">
                                        {c('Info')
                                            .t`We will send a code to this phone number if you forget your password or get locked out of your account.`}
                                    </div>
                                    <InputFieldTwo
                                        as={PhoneInput}
                                        id="recovery-phone"
                                        bigger
                                        label={c('Label').t`Recovery phone`}
                                        error={validator(
                                            model.step === RECOVERY_PHONE
                                                ? [requiredValidator(model.recoveryPhone), phoneError]
                                                : []
                                        )}
                                        disableChange={loading}
                                        autoFocus
                                        defaultCountry={defaultCountry}
                                        value={model.recoveryPhone}
                                        onChange={(value: string) => {
                                            setPhoneError('');
                                            setRecoveryPhone(value);
                                        }}
                                    />
                                </>
                            ),
                        },
                    ]}
                    onChange={() => {
                        setEmailError('');
                        setPhoneError('');
                        onChange({
                            step: model.step === RECOVERY_EMAIL ? RECOVERY_PHONE : RECOVERY_EMAIL,
                            recoveryEmail: '',
                            recoveryPhone: '',
                        });
                    }}
                />
                <Challenge
                    key="challenge"
                    style={model.step === RECOVERY_EMAIL ? undefined : { display: 'none' }}
                    bodyClassName="sign-layout-container"
                    challengeRef={challengeRefRecovery}
                    type={1}
                    onLoaded={handleChallengeLoaded}
                >
                    <DefaultThemeInjector />
                    <Icons />
                    <InputFieldTwo
                        id="recovery-email"
                        bigger
                        label={c('Label').t`Recovery email`}
                        error={validator(
                            model.step === RECOVERY_EMAIL ? [requiredValidator(model.recoveryEmail), emailError] : []
                        )}
                        autoFocus
                        disableChange={loading}
                        type="email"
                        value={model.recoveryEmail}
                        onValue={(value: string) => {
                            setEmailError('');
                            setRecoveryEmail(value);
                        }}
                        onKeyDown={({ key }: React.KeyboardEvent<HTMLInputElement>) => {
                            if (key === 'Enter') {
                                withLoading(handleSubmit()).catch(noop);
                            }
                        }}
                    />
                </Challenge>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                    {c('Action').t`Next`}
                </Button>
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    type="button"
                    fullWidth
                    disabled={loading}
                    onClick={handleSkip}
                    className="mt0-25"
                >
                    {c('Action').t`Skip`}
                </Button>
            </form>
        </>
    );
};
export default RecoveryForm;
