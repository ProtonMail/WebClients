import React from 'react';
import { c } from 'ttag';
import {
    PrimaryButton,
    SubTitle,
    Loader,
    Toggle,
    Info,
    Label,
    Row,
    Field,
    useModals,
    useUserSettings
} from 'react-components';
import ChangePasswordModal, { MODES } from './ChangePasswordModal';

const PasswordsSection = () => {
    const [{ PasswordMode } = {}, loading] = useUserSettings();
    const { createModal } = useModals();

    const title = <SubTitle>{c('Title').t`Passwords`}</SubTitle>;

    if (loading) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    const isOnePasswordMode = PasswordMode === 1;
    const passwordLabel = isOnePasswordMode ? c('Title').t`Password` : c('Title').t`Login password`;
    const passwordButtonLabel = isOnePasswordMode ? c('Title').t`Change password` : c('Title').t`Change login password`;

    const handleChangePassword = (mode) => {
        createModal(<ChangePasswordModal mode={mode} />);
    };

    return (
        <>
            {title}
            <Row>
                <Label htmlFor="passwordChange">{passwordLabel}</Label>
                <Field>
                    <PrimaryButton
                        onClick={() =>
                            handleChangePassword(
                                isOnePasswordMode
                                    ? MODES.CHANGE_ONE_PASSWORD_MODE
                                    : MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE
                            )
                        }
                    >
                        {passwordButtonLabel}
                    </PrimaryButton>
                </Field>
            </Row>
            <Row>
                <Label htmlFor="passwordModeToggle">
                    <span className="mr0-5">{c('Label').t`Two password mode`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/single-password" />
                </Label>
                <Field>
                    <Toggle
                        loading={loading}
                        checked={!isOnePasswordMode}
                        id="passwordModeToggle"
                        onChange={() =>
                            handleChangePassword(
                                isOnePasswordMode ? MODES.SWITCH_TWO_PASSWORD : MODES.SWITCH_ONE_PASSWORD
                            )
                        }
                    />
                </Field>
            </Row>
            {!isOnePasswordMode && (
                <Row>
                    <Label htmlFor="passwordModeToggle">
                        <span className="mr0-5">{c('Label').t`Mailbox password`}</span>
                        <Info url="https://protonmail.com/support/knowledge-base/single-password" />
                    </Label>
                    <Field>
                        <PrimaryButton onClick={() => handleChangePassword(MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE)}>
                            {c('Action').t`Change mailbox password`}
                        </PrimaryButton>
                    </Field>
                </Row>
            )}
        </>
    );
};

export default PasswordsSection;
