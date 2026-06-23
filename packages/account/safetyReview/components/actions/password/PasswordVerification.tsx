import { useRef, useState } from 'react';

import { c } from 'ttag';

import { submitPasswordReminder } from '@proton/account/passwordReminder';
import PasswordReminderInput from '@proton/account/passwordReminder/PasswordReminderInput';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import { SafetyReviewCardHeader } from '@proton/account/safetyReview/components/cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Form from '@proton/components/components/form/Form';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Modal, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { TwoFactorAuth } from '@proton/components/containers/password/TwoFactorAuth';
import { getReAuthTwoFactorTypes } from '@proton/components/containers/password/getReAuthTwoFactorTypes';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { PASSWORD_WRONG_ERROR, type TwoFactorCredentials, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import illustration from '../../assets/password-verification.svg';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'passwordVerification'>;
};

interface State {
    info: InfoAuthedResponse;
    reAuthTwoFactorTypes: TwoFactorAuthTypes;
}

interface TwoFactorModalProps extends ModalProps {
    info: InfoAuthedResponse;
    reAuthTwoFactorTypes: TwoFactorAuthTypes;
    onSuccess: (data: TwoFactorCredentials) => void;
}
const TwoFactorModal = ({ onSuccess, info, reAuthTwoFactorTypes, ...props }: TwoFactorModalProps) => {
    const formId = 'two-factor-auth';
    const [submitting, withSubmitting] = useLoading();

    return (
        <Modal {...props} size="small">
            <ModalHeader title={c('Title').t`Two-factor authentication`} />
            <ModalContent>
                <TwoFactorAuth
                    formId={formId}
                    twoFactor={reAuthTwoFactorTypes}
                    fido2={info['2FA'].FIDO2}
                    onSubmit={(promise) => {
                        const run = async () => {
                            onSuccess(await promise);
                        };
                        withSubmitting(run()).catch(noop);
                    }}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" form={formId} loading={submitting}>
                    {c('Action').t`Authenticate`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

class CancelError extends Error {}

export const PasswordVerification = (props: Props) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const api = useSilentApi();

    const [password, setPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const [submitting, withSubmitting] = useLoading();

    const [twoFactorPromptModal, showTwoFactorPromptModal] = useModalTwoPromise<State, TwoFactorCredentials>();

    const { APP_NAME } = useConfig();

    const passwordReminderRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        try {
            const info = await api<InfoAuthedResponse>(getInfo({}));

            const reAuthTwoFactorTypes = getReAuthTwoFactorTypes({
                app: APP_NAME,
                infoResult: info,
                scope: 'password',
                userSettings: undefined,
            });

            let credentials: null | TwoFactorCredentials = null;
            if (reAuthTwoFactorTypes.enabled) {
                credentials = await showTwoFactorPromptModal({ info, reAuthTwoFactorTypes });
            }

            await dispatch(submitPasswordReminder({ api, password, info, credentials }));
            props.safetyReview.actions.next('completed', props.recoveryItem);
        } catch (error) {
            if (error instanceof CancelError) {
                return;
            }
            const { code } = getApiError(error);
            if (code === PASSWORD_WRONG_ERROR) {
                setTimeout(() => passwordReminderRef.current?.focus(), 0);
            }
            handleError(error);
        }
    };

    return (
        <>
            {twoFactorPromptModal(({ onReject, onResolve, info, reAuthTwoFactorTypes, ...props }) => {
                return (
                    <TwoFactorModal
                        {...props}
                        info={info}
                        reAuthTwoFactorTypes={reAuthTwoFactorTypes}
                        onSuccess={onResolve}
                        onExit={() => {
                            props.onExit();
                            onReject(new CancelError());
                        }}
                    />
                );
            })}

            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Verify your password`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review').t`To help you remember your password, we’ll periodically ask you to enter it.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <Form
                id={props.firstItemId ?? undefined}
                onSubmit={() => {
                    if (!onFormSubmit()) {
                        return;
                    }
                    void withSubmitting(handleSubmit().catch(handleError));
                }}
            >
                <InputFieldTwo
                    autoFocus
                    id="password-reminder"
                    as={PasswordReminderInput}
                    ref={passwordReminderRef}
                    value={password}
                    disableChange={submitting}
                    onValue={setPassword}
                    error={validator([requiredValidator(password)])}
                    label={c('Label').t`Enter current password`}
                    bigger
                />
                <ButtonLike
                    shape="underline"
                    color="norm"
                    as={SettingsLink}
                    path="/account-password?action=forgot-password"
                >
                    {c('Info').t`Forgot password?`}
                </ButtonLike>
            </Form>

            <SafetyReviewCta {...props} loading={submitting} cta={c('safety_review').t`Verify`} />
        </>
    );
};
