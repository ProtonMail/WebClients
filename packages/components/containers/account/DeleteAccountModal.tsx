import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account/authenticationService';
import { useGetOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Form from '@proton/components/components/form/Form';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { leaveOrganisation } from '@proton/shared/lib/api/organization';
import { canDelete, deleteUser, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { ACCOUNT_DELETION_REASONS, BRAND_NAME } from '@proton/shared/lib/constants';
import { minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

const { DIFFERENT_ACCOUNT, TOO_EXPENSIVE, MISSING_FEATURE, USE_OTHER_SERVICE, MERGE_ACCOUNT, OTHER } =
    ACCOUNT_DELETION_REASONS;

interface Props extends Omit<ModalProps<'form'>, 'as'> {
    onSuccess?: () => Promise<void>;
    disableLogout?: boolean;
    hideHeader?: boolean;
}

enum STEP {
    REASON_SELECTION,
    CONFIRM_ACCOUNT_DELETION,
}

const DeleteAccountModal = (props: Props) => {
    const deleteAccountMergeReasonEnabled = useFlag('DeleteAccountMergeReason');
    const [step, setStep] = useState<STEP>(STEP.REASON_SELECTION);

    const reasonsWhichIgnoreFeedback: ACCOUNT_DELETION_REASONS[] = [MERGE_ACCOUNT];

    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();
    const { createNotification } = useNotifications();

    const defaultOnSuccess = async () => {
        createNotification({ text: c('Success').t`Account deleted. Signing out...` });

        // Add an artificial delay to show the notification.
        await wait(2500);
    };

    const { onSuccess = defaultOnSuccess, hideHeader = false, onClose, disableCloseOnEscape, ...rest } = props;
    const eventManager = useEventManager();
    const api = useApi();
    const [{ isAdmin, Email }] = useUser();
    const getOrganization = useGetOrganization();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();

    const [model, setModel] = useState({
        check: false,
        mergeUnderstanding: false,
        reason: '',
        feedback: '',
    });
    const { validator, onFormSubmit, reset } = useFormErrors();

    const reasons = [
        <Option
            title={c('Option').t`I use a different ${BRAND_NAME} account`}
            value={DIFFERENT_ACCOUNT}
            key={DIFFERENT_ACCOUNT}
        />,
        isAdmin && <Option title={c('Option').t`It's too expensive`} value={TOO_EXPENSIVE} key={TOO_EXPENSIVE} />,
        <Option
            title={c('Option').t`It's missing a key feature that I need`}
            value={MISSING_FEATURE}
            key={MISSING_FEATURE}
        />,
        <Option
            title={c('Option').t`I found another service that I like better`}
            value={USE_OTHER_SERVICE}
            key={USE_OTHER_SERVICE}
        />,
        deleteAccountMergeReasonEnabled && (
            <Option
                title={c('Option').t`I'd like to merge this account into another one`}
                value={MERGE_ACCOUNT}
                key={MERGE_ACCOUNT}
            />
        ),
        <Option title={c('Option').t`My reason isn't listed`} value={OTHER} key={OTHER} />,
    ].filter(isTruthy);

    const includeFeedback = !reasonsWhichIgnoreFeedback.includes(model.reason as ACCOUNT_DELETION_REASONS);

    const handleSubmit = async () => {
        try {
            eventManager.stop();

            await api(canDelete());

            const organization = await getOrganization();
            // If a user is part of a family plan or duo plan we first need to leave the organization before deleting the account.
            // Refreshing the event manager is necessary to update the organization state
            if (getOrganizationDenomination(organization) === 'familyGroup' && !isAdmin) {
                await api(leaveOrganisation());
                await eventManager.call();
                eventManager.stop();
            }

            await api(
                deleteUser({
                    Reason: model.reason,
                    Feedback: includeFeedback ? model.feedback : undefined,
                })
            );

            await onSuccess?.();
            if (!props.disableLogout) {
                dispatch(signoutAction({ clearDeviceRecovery: true }));
            }
            onClose?.();
        } catch (error: any) {
            eventManager.start();
            throw error;
        }
    };

    const { onSubmit, content, footer } = (() => {
        if (step === STEP.REASON_SELECTION) {
            const supportLink = (
                <Href key="link-to-support" href="https://proton.me/support/contact-product">
                    {
                        // translator: Full sentence: "This message won't reach the support team, if you have an issue with our service or need further action from our side please open a support ticket."
                        c('Info').t`please open a support ticket`
                    }
                </Href>
            );

            return {
                onSubmit: (event: FormEvent<HTMLFormElement>) => {
                    if (!onFormSubmit(event.currentTarget)) {
                        return;
                    }

                    reset();
                    setStep(STEP.CONFIRM_ACCOUNT_DELETION);
                },
                content: (
                    <>
                        <InputFieldTwo
                            as={SelectTwo}
                            label={c('Label').t`What is the main reason you are deleting your account?`}
                            placeholder={c('Placeholder').t`Select a reason`}
                            id="reason"
                            autoFocus
                            value={model.reason}
                            onValue={(value: unknown) => setModel({ ...model, reason: value as string })}
                            error={validator([requiredValidator(model.reason)])}
                            disabled={loading}
                        >
                            {reasons}
                        </InputFieldTwo>

                        {includeFeedback && (
                            <InputFieldTwo
                                id="feedback"
                                as={TextAreaTwo}
                                rows={3}
                                label={c('Label').t`To help us improve, please explain why you are leaving.`}
                                placeholder={c('Placeholder').t`Feedback`}
                                value={model.feedback}
                                onValue={(value: string) => setModel({ ...model, feedback: value })}
                                error={validator([
                                    requiredValidator(model.feedback),
                                    minLengthValidator(model.feedback, 10),
                                ])}
                                disabled={loading}
                            />
                        )}

                        <p className="text-sm color-weak mt-0">
                            {
                                // translator: Full sentence: "This message won't reach the support team, if you have an issue with our service or need further action from our side please open a support ticket."
                                c('Info')
                                    .jt`This message won't reach the support team, if you have an issue with our service or need further action from our side ${supportLink}.`
                            }
                        </p>
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                        <Button color="norm" loading={loading} type="submit">
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.CONFIRM_ACCOUNT_DELETION) {
            return {
                onSubmit: (event: FormEvent<HTMLFormElement>) => {
                    if (!onFormSubmit(event.currentTarget)) {
                        return;
                    }
                    setAuthModalOpen(true);
                },
                content: (
                    <>
                        <div className="text-bold">{c('Info').t`Warning: deleting your account is permanent.`}</div>

                        <div>
                            {c('Info')
                                .t`This will remove your access to all connected services and delete all of your data, including contacts, attachments, events, passwords, and files.`}
                        </div>

                        <InputFieldTwo
                            className="mt-4"
                            id="check"
                            as={Checkbox}
                            error={validator([!model.check ? requiredValidator(undefined) : ''])}
                            checked={model.check}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                setModel({ ...model, check: target.checked })
                            }
                            disabled={loading}
                        >
                            {c('Label').t`Yes, I want to permanently delete this account and all its data.`}
                        </InputFieldTwo>

                        {model.reason === MERGE_ACCOUNT && (
                            <InputFieldTwo
                                id="check"
                                as={Checkbox}
                                error={validator([!model.mergeUnderstanding ? requiredValidator(undefined) : ''])}
                                checked={model.mergeUnderstanding}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    setModel({ ...model, mergeUnderstanding: target.checked })
                                }
                                disabled={loading}
                            >
                                {c('Label')
                                    .t`I understand that I'll need to add this email address to the other account immediately, to avoid losing this address permanently.`}
                            </InputFieldTwo>
                        )}
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={() => setStep(STEP.REASON_SELECTION)} disabled={loading}>{c('Action')
                            .t`Back`}</Button>
                        <Button color="danger" loading={loading} type="submit">
                            {c('Action').t`Delete account`}
                        </Button>
                    </>
                ),
            };
        }

        throw Error(`Invalid step`);
    })();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    scope="password"
                    config={unlockPasswordChanges()}
                    {...authModalProps}
                    onCancel={undefined}
                    onSuccess={() => {
                        void withLoading(handleSubmit());
                    }}
                />
            )}
            <ModalTwo
                as={Form}
                onClose={hideHeader ? undefined : onClose}
                disableCloseOnEscape={disableCloseOnEscape || loading}
                size="medium"
                onSubmit={loading ? noop : onSubmit}
                {...rest}
            >
                {!hideHeader && <ModalTwoHeader title={c('Title').t`Delete account`} subline={Email} />}
                <ModalTwoContent>{content}</ModalTwoContent>
                <ModalTwoFooter className="flex-column">
                    <div className="flex justify-space-between">{footer}</div>

                    <div className="flex justify-center">
                        <StepDots ulClassName="m-0">
                            <StepDot
                                active={step === STEP.REASON_SELECTION}
                                key={STEP.REASON_SELECTION}
                                index={STEP.REASON_SELECTION}
                            />
                            <StepDot
                                active={step === STEP.CONFIRM_ACCOUNT_DELETION}
                                key={STEP.CONFIRM_ACCOUNT_DELETION}
                                index={STEP.CONFIRM_ACCOUNT_DELETION}
                            />
                        </StepDots>
                    </div>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default DeleteAccountModal;
