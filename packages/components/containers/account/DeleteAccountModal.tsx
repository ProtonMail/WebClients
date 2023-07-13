import { ChangeEvent, FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { leaveOrganisation } from '@proton/shared/lib/api/organization';
import { reportBug } from '@proton/shared/lib/api/reports';
import { canDelete, deleteUser, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { ACCOUNT_DELETION_REASONS, BRAND_NAME } from '@proton/shared/lib/constants';
import { emailValidator, minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { omit } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isOrganizationFamily } from '@proton/shared/lib/organization/helper';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import {
    Alert,
    Checkbox,
    ErrorButton,
    Form,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    useModalState,
} from '../../components';
import { AuthModal } from '../../containers';
import { getClientName, getReportInfo } from '../../helpers/report';
import {
    useApi,
    useAuthentication,
    useConfig,
    useEventManager,
    useNotifications,
    useOrganization,
    useUser,
} from '../../hooks';

const { DIFFERENT_ACCOUNT, TOO_EXPENSIVE, MISSING_FEATURE, USE_OTHER_SERVICE, OTHER } = ACCOUNT_DELETION_REASONS;

interface Props extends Omit<ModalProps<'form'>, 'as'> {
    onSuccess?: () => Promise<void>;
    hideHeader?: boolean;
}

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
    const [{ isAdmin, Name, Email }] = useUser();
    const [organization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState({
        check: false,
        reason: '',
        feedback: '',
        email: '',
    });
    const { validator, onFormSubmit } = useFormErrors();
    const { APP_NAME, APP_VERSION, CLIENT_TYPE } = useConfig();
    const Client = getClientName(APP_NAME);

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

            if (isAdmin) {
                await api(
                    reportBug({
                        ...omit(getReportInfo(), ['OSArtificial']),
                        Client,
                        ClientVersion: APP_VERSION,
                        ClientType: CLIENT_TYPE,
                        Title: `[DELETION FEEDBACK] ${Name}`,
                        Username: Name || Email,
                        Email: model.email,
                        Description: model.feedback,
                    })
                );
            }

            // If a user is part of a family plan we first need to leave the organization before deleting the account.
            // Refreshing the event manager is necessary to update the organization state
            if (isOrganizationFamily(organization) && !isAdmin) {
                eventManager.start();
                await api(leaveOrganisation());
                await eventManager.call();
                eventManager.stop();
            }

            await api(
                deleteUser({
                    Reason: model.reason,
                    Feedback: model.feedback,
                    Email: model.email,
                })
            );

            await onSuccess?.();
            onClose?.();
            authentication.logout();
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
                        rootClassName="mb-2"
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
                        rootClassName="mt-2"
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
                        id="email"
                        rootClassName="mt-2"
                        label={c('Label').t`Email address`}
                        placeholder={c('Placeholder').t`Email address`}
                        assistiveText={c('Info').t`Please provide an email address in case we need to contact you.`}
                        value={model.email}
                        onValue={(value: string) => setModel({ ...model, email: value })}
                        error={validator([requiredValidator(model.email), emailValidator(model.email)])}
                        disabled={loading}
                    />

                    <InputFieldTwo
                        rootClassName="mt-4"
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
