import { ChangeEvent, FormEvent, useState } from 'react';
import { c } from 'ttag';
import { ACCOUNT_DELETION_REASONS } from '@proton/shared/lib/constants';
import { deleteUser, canDelete, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { reportBug } from '@proton/shared/lib/api/reports';
import { srpAuth } from '@proton/shared/lib/srp';
import { wait } from '@proton/shared/lib/helpers/promise';
import isTruthy from '@proton/utils/isTruthy';
import { getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { omit } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { emailValidator, minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { getReportInfo, getClientName } from '../../helpers/report';
import {
    Alert,
    Button,
    Checkbox,
    ErrorButton,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    ModalTwoFooter,
    Option,
    PasswordInputTwo,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    Form,
} from '../../components';
import {
    useEventManager,
    useUser,
    useNotifications,
    useUserSettings,
    useApi,
    useLoading,
    useAuthentication,
    useConfig,
} from '../../hooks';

const { DIFFERENT_ACCOUNT, TOO_EXPENSIVE, MISSING_FEATURE, USE_OTHER_SERVICE, OTHER } = ACCOUNT_DELETION_REASONS;

interface Props extends Omit<ModalProps<'form'>, 'as'> {
    onSuccess?: () => Promise<void>;
    hideHeader?: boolean;
}

const DeleteAccountModal = (props: Props) => {
    const { createNotification } = useNotifications();

    const defaultOnSuccess = async () => {
        createNotification({ text: c('Success').t`Account deleted. Logging out...` });

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
    const [{ isAdmin, Name }] = useUser();
    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState({
        check: false,
        reason: '',
        feedback: '',
        email: '',
        password: '',
        twoFa: '',
    });
    const { validator, onFormSubmit } = useFormErrors();
    const { APP_NAME, APP_VERSION, CLIENT_TYPE } = useConfig();
    const Client = getClientName(APP_NAME);
    const hasTOTPEnabled = getHasTOTPSettingEnabled(userSettings);

    const reasons = [
        <Option
            title={c('Option').t`I use a different Proton account`}
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        if (!onFormSubmit(event.currentTarget)) {
            return;
        }

        try {
            eventManager.stop();

            await srpAuth({
                api,
                credentials: { password: model.password, totp: model.twoFa },
                config: unlockPasswordChanges(),
            });

            await api(canDelete());

            if (isAdmin) {
                await api(
                    reportBug({
                        ...omit(getReportInfo(), ['OSArtificial']),
                        Client,
                        ClientVersion: APP_VERSION,
                        ClientType: CLIENT_TYPE,
                        Title: `[DELETION FEEDBACK] ${Name}`,
                        Username: Name,
                        Email: model.email,
                        Description: model.feedback,
                    })
                );
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
        <ModalTwo
            as={Form}
            onClose={hideHeader ? undefined : onClose}
            disableCloseOnEscape={disableCloseOnEscape || loading}
            size={size}
            onSubmit={loading ? noop : (event: FormEvent<HTMLFormElement>) => withLoading(handleSubmit(event))}
            {...rest}
        >
            {!hideHeader && <ModalTwoHeader title={c('Title').t`Delete account`} />}
            <ModalTwoContent>
                <Alert className="mb1" type="warning" learnMore={getKnowledgeBaseUrl('/combine-accounts')}>
                    <div className="text-bold text-uppercase">
                        {c('Info')
                            .t`Warning: deletion is permanent. This also removes access to all connected services and deletes all of your contacts.`}
                    </div>
                    <div>{c('Info').t`If you wish to combine this account with another one, do NOT delete it.`}</div>
                </Alert>
                <InputFieldTwo
                    rootClassName="mb0-5"
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
                    rootClassName="mt0-5"
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
                    rootClassName="mt0-5"
                    label={c('Label').t`Email address`}
                    placeholder={c('Placeholder').t`Email address`}
                    assistiveText={c('Info').t`Please provide an email address in case we need to contact you.`}
                    value={model.email}
                    onValue={(value: string) => setModel({ ...model, email: value })}
                    error={validator([requiredValidator(model.email), emailValidator(model.email)])}
                    disabled={loading}
                />

                <InputFieldTwo
                    id="password"
                    rootClassName="mt0-5"
                    label={c('Label').t`Login password`}
                    placeholder={c('Placeholder').t`Password`}
                    assistiveText={c('Info').t`Enter your login password to confirm your identity.`}
                    error={validator([requiredValidator(model.password)])}
                    as={PasswordInputTwo}
                    autoComplete="current-password"
                    value={model.password}
                    onValue={(value: string) => setModel({ ...model, password: value })}
                    disabled={loading}
                />

                {hasTOTPEnabled && (
                    <InputFieldTwo
                        id="twoFa"
                        rootClassName="mt0-5"
                        label={c('Label').t`Two-factor authentication code`}
                        placeholder={c('Placeholder').t`Two-factor authentication code`}
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="one-time-code"
                        value={model.twoFa}
                        onValue={(value: string) => setModel({ ...model, twoFa: value })}
                        error={validator([requiredValidator(model.twoFa)])}
                        disabled={loading}
                    />
                )}
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <ErrorButton loading={loading} type="submit">
                    {c('Action').t`Delete`}
                </ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteAccountModal;
