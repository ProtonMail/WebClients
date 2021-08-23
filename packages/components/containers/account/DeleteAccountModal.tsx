import { useState, useMemo, ChangeEvent } from 'react';
import { c } from 'ttag';
import { ACCOUNT_DELETION_REASONS } from '@proton/shared/lib/constants';
import { deleteUser, canDelete, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { reportBug } from '@proton/shared/lib/api/reports';
import { srpAuth } from '@proton/shared/lib/srp';
import { wait } from '@proton/shared/lib/helpers/promise';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { omit } from '@proton/shared/lib/helpers/object';

import { getReportInfo, getClient } from '../../helpers/report';
import {
    Checkbox,
    Row,
    Field,
    Label,
    Select,
    TextArea,
    EmailInput,
    PasswordInput,
    TwoFactorInput,
    FormModal,
    Alert,
    ErrorButton,
    Info,
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

interface Props {
    onClose?: () => void;
}

const DeleteAccountModal = ({ onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
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
    const { APP_NAME, APP_VERSION, CLIENT_TYPE } = useConfig();
    const ClientID = getClientID(APP_NAME);
    const Client = getClient(ClientID);
    const hasTOTPEnabled = getHasTOTPSettingEnabled(userSettings);

    const isDisabled = useMemo(() => {
        if (!model.check || !model.reason || !model.email || !model.password) {
            return true;
        }
        if (hasTOTPEnabled && !model.twoFa) {
            return true;
        }
        return false;
    }, [model.check, model.reason, model.feedback, model.email, model.password, model.twoFa]);

    const handleChange =
        (key: string) =>
        ({ target }: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) =>
            setModel({
                ...model,
                [key]: target.value,
            });

    const reasons = [
        { text: c('Option').t`Select a reason`, value: '', disabled: true },
        { text: c('Option').t`I use a different Proton account`, value: ACCOUNT_DELETION_REASONS.DIFFERENT_ACCOUNT },
        isAdmin && { text: c('Option').t`It's too expensive`, value: ACCOUNT_DELETION_REASONS.TOO_EXPENSIVE },
        {
            text: c('Option').t`It's missing a key feature that I need`,
            value: ACCOUNT_DELETION_REASONS.MISSING_FEATURE,
        },
        {
            text: c('Option').t`I found another service that I like better`,
            value: ACCOUNT_DELETION_REASONS.USE_OTHER_SERVICE,
        },
        { text: c('Option').t`My reason isn't listed`, value: ACCOUNT_DELETION_REASONS.OTHER },
    ].filter(isTruthy);

    const handleSubmit = async () => {
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

            createNotification({ text: c('Success').t`Account deleted. Logging out...` });

            // Add an artificial delay to show the notification.
            await wait(2500);

            onClose?.();
            authentication.logout();
        } catch (error) {
            eventManager.start();
            throw error;
        }
    };

    return (
        <FormModal
            onSubmit={() => withLoading(handleSubmit())}
            onClose={onClose}
            close={c('Action').t`Cancel`}
            submit={
                <ErrorButton loading={loading} disabled={isDisabled} type="submit">{c('Action').t`Delete`}</ErrorButton>
            }
            title={c('Title').t`Delete account`}
            loading={loading}
            {...rest}
        >
            <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/combine-accounts/">
                <div className="text-bold text-uppercase">
                    {c('Info')
                        .t`Warning: deletion is permanent. This also removes access to all connected services and deletes all of your contacts.`}
                </div>
                <div>{c('Info').t`If you wish to combine this account with another one, do NOT delete it.`}</div>
            </Alert>
            <Row>
                <Label htmlFor="reason">{c('Label').t`What is the main reason you are deleting your account?`}</Label>
                <Field>
                    <Select
                        id="reason"
                        autoFocus
                        options={reasons}
                        value={model.reason}
                        onChange={handleChange('reason')}
                        disabled={loading}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="feedback">{c('Label')
                    .t`We are sorry to see you go. Please explain why you are leaving to help us improve.`}</Label>
                <Field>
                    <TextArea
                        id="feedback"
                        rows={3}
                        value={model.feedback}
                        placeholder={c('Placeholder').t`Feedback`}
                        onChange={handleChange('feedback')}
                        disabled={loading}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="email">
                    {c('Label').t`Email address`}
                    &nbsp;
                    <Info title={c('Info').t`Please provide an email address in case we need to contact you.`} />
                </Label>
                <Field>
                    <div className="mb0-5">
                        <EmailInput
                            id="email"
                            required
                            disabled={loading}
                            value={model.email}
                            onChange={handleChange('email')}
                            placeholder={c('Placeholder').t`Email address`}
                        />
                    </div>
                </Field>
            </Row>
            <Row>
                <Label htmlFor="password">
                    {c('Label').t`Login password`}
                    &nbsp;
                    <Info title={c('Info').t`Enter your login password to confirm your identity.`} />
                </Label>
                <Field>
                    <div className="mb0-5">
                        <PasswordInput
                            id="password"
                            required
                            disabled={loading}
                            value={model.password}
                            onChange={handleChange('password')}
                            placeholder={c('Placeholder').t`Password`}
                        />
                    </div>
                </Field>
            </Row>
            {hasTOTPEnabled ? (
                <Row>
                    <Label htmlFor="twoFa">{c('Label').t`Two-factor authentication code`}</Label>
                    <Field>
                        <TwoFactorInput
                            id="twoFa"
                            required
                            disabled={loading}
                            value={model.twoFa}
                            onChange={handleChange('twoFa')}
                            placeholder={c('Placeholder').t`Two-factor authentication code`}
                        />
                    </Field>
                </Row>
            ) : null}
            <Row>
                <Checkbox
                    required
                    id="check"
                    checked={model.check}
                    disabled={loading}
                    onChange={({ target }) => setModel({ ...model, check: target.checked })}
                >{c('Label').t`Yes, I want to permanently delete this account and all its data.`}</Checkbox>
            </Row>
        </FormModal>
    );
};

export default DeleteAccountModal;
