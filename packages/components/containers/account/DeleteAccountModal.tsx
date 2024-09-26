import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import ErrorButton from '@proton/components/components/button/ErrorButton';
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
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useLoading } from '@proton/hooks';
import { leaveOrganisation } from '@proton/shared/lib/api/organization';
import { canDelete, deleteUser, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { handleLogout } from '@proton/shared/lib/authentication/logout';
import { ACCOUNT_DELETION_REASONS, BRAND_NAME } from '@proton/shared/lib/constants';
import { minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useApi, useConfig, useEventManager, useGetOrganization, useNotifications, useUser } from '../../hooks';

const { DIFFERENT_ACCOUNT, TOO_EXPENSIVE, MISSING_FEATURE, USE_OTHER_SERVICE, OTHER } = ACCOUNT_DELETION_REASONS;

interface Props extends Omit<ModalProps<'form'>, 'as'> {
    onSuccess?: () => Promise<void>;
    hideHeader?: boolean;
}

const SupportParagraph = () => {
    {
        /* translator: Full sentence: "This message won't reach the support team, if you have an issue with our service or need further action from our side please open a support ticket." */
    }
    const supportLink = (
        <Href key="link-to-support" href="https://proton.me/support/contact-product">{c('Info')
            .t`please open a support ticket`}</Href>
    );

    return (
        <p className="text-sm color-weak mt-0">
            {/* translator: Full sentence: "This message won't reach the support team, if you have an issue with our service or need further action from our side please open a support ticket." */}
            {c('Info')
                .jt`This message won't reach the support team, if you have an issue with our service or need further action from our side ${supportLink}.`}
        </p>
    );
};

const DeleteAccountModal = (props: Props) => {
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();
    const { createNotification } = useNotifications();

    const defaultOnSuccess = async () => {
        createNotification({ text: c('Success').t`Account deleted. Signing out...` });

        // Add an artificial delay to show the notification.
        await wait(2500);
    };

    const {
        onSuccess = defaultOnSuccess,
        hideHeader = false,
        onClose,
        disableCloseOnEscape,
        size = 'large',
        ...rest
    } = props;
    const eventManager = useEventManager();
    const api = useApi();
    const authentication = useAuthentication();
    const [{ isAdmin }] = useUser();
    const getOrganization = useGetOrganization();
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState({
        check: false,
        reason: '',
        feedback: '',
    });
    const { validator, onFormSubmit } = useFormErrors();
    const { APP_NAME } = useConfig();

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
        <Option title={c('Option').t`My reason isn't listed`} value={OTHER} key={OTHER} />,
    ].filter(isTruthy);

    const handleSubmit = async () => {
        try {
            eventManager.stop();

            await api(canDelete());

            const organization = await getOrganization();
            // If a user is part of a family plan or duo plan we first need to leave the organization before deleting the account.
            // Refreshing the event manager is necessary to update the organization state
            if (getOrganizationDenomination(organization) === 'familyGroup' && !isAdmin) {
                eventManager.start();
                await api(leaveOrganisation());
                await eventManager.call();
                eventManager.stop();
            }

            await api(
                deleteUser({
                    Reason: model.reason,
                    Feedback: model.feedback,
                })
            );

            await onSuccess?.();
            onClose?.();
            handleLogout({ appName: APP_NAME, authentication, clearDeviceRecoveryData: true, type: 'full' });
        } catch (error: any) {
            eventManager.start();
            throw error;
        }
    };

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={unlockPasswordChanges()}
                    {...authModalProps}
                    onCancel={undefined}
                    onSuccess={() => {
                        withLoading(handleSubmit());
                    }}
                />
            )}
            <ModalTwo
                as={Form}
                onClose={hideHeader ? undefined : onClose}
                disableCloseOnEscape={disableCloseOnEscape || loading}
                size={size}
                onSubmit={
                    loading
                        ? noop
                        : (event: FormEvent<HTMLFormElement>) => {
                              if (!onFormSubmit(event.currentTarget)) {
                                  return;
                              }
                              setAuthModalOpen(true);
                          }
                }
                {...rest}
            >
                {!hideHeader && <ModalTwoHeader title={c('Title').t`Delete account`} />}
                <ModalTwoContent>
                    <Alert className="mb-4" type="warning">
                        <div className="text-bold text-uppercase">
                            {c('Info')
                                .t`Warning: deletion is permanent. This also removes access to all connected services and deletes all of your contacts.`}
                        </div>
                        <div>
                            {c('Info').t`If you wish to combine this account with another one, do NOT delete it.`}
                        </div>
                        <div>
                            <Href href={getKnowledgeBaseUrl('/combine-accounts')}>{c('Link').t`Learn more`}</Href>
                        </div>
                    </Alert>
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

                    <InputFieldTwo
                        id="feedback"
                        as={TextAreaTwo}
                        rows={3}
                        label={c('Label')
                            .t`We are sorry to see you go. Please explain why you are leaving to help us improve.`}
                        placeholder={c('Placeholder').t`Feedback`}
                        value={model.feedback}
                        onValue={(value: string) => setModel({ ...model, feedback: value })}
                        error={validator([requiredValidator(model.feedback), minLengthValidator(model.feedback, 10)])}
                        disabled={loading}
                    />

                    <InputFieldTwo
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

                    <SupportParagraph />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                    <ErrorButton loading={loading} type="submit">
                        {c('Action').t`Delete`}
                    </ErrorButton>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default DeleteAccountModal;
