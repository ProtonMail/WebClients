import React, { ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';

import { Alert, Row, Label, Field, PasswordInput, EmailInput, Input, Href } from '../../../../components';

import {
    IMAPS,
    INVALID_CREDENTIALS_ERROR_LABEL,
    IMAP_AUTHENTICATION_ERROR_LABEL,
    IMAP_CONNECTION_ERROR_LABEL,
} from '../../constants';

import { Importer, ImportMailError, ImportModalModel, IMPORT_ERROR } from '../../interfaces';

interface Props {
    modalModel: ImportModalModel;
    updateModalModel: (newModel: ImportModalModel) => void;
    needAppPassword: boolean;
    showPassword: boolean;
    currentImport?: Importer;
    invalidPortError: boolean;
}

const ImportStartStep = ({
    modalModel,
    updateModalModel,
    needAppPassword,
    showPassword,
    currentImport,
    invalidPortError,
}: Props) => {
    const { email, password, needIMAPDetails, imap, port, errorCode, errorLabel } = modalModel;

    useEffect(() => {
        if (!email) {
            updateModalModel({ ...modalModel, password: '', port: '', imap: '' });
        }
    }, [email]);

    const isAuthError = [INVALID_CREDENTIALS_ERROR_LABEL, IMAP_AUTHENTICATION_ERROR_LABEL].includes(errorLabel);
    const isIMAPError = errorLabel === IMAP_CONNECTION_ERROR_LABEL;
    const isReconnect = currentImport?.Active?.ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

    let imapPortError = isIMAPError ? errorLabel : undefined;
    if (invalidPortError) {
        imapPortError = c('Import error').t`Invalid IMAP port`;
    }

    const renderError = () => {
        let message = null;

        const bold2StepsDisabled = (
            <strong key="bold2StepsDisabled">{c('Import error emphasis').t`2-step verification is disabled`}</strong>
        );
        const bold2StepsEnabled = (
            <strong key="bold2StepsEnabled">{c('Import error emphasis').t`2-step verification is enabled`}</strong>
        );
        const boldGoogleAccounts = (
            <strong key="boldGoogleAccounts">{c('Import error emphasis').t`all your other Google accounts`}</strong>
        );
        const boldNot = <strong key="boldNot">{c('Import error emphasis').t`not`}</strong>;
        const linkCAPTCHA = (
            <Href key="linkCAPTCHA" url="https://accounts.google.com/DisplayUnlockCaptcha">
                {c('Import error emphasis').t`CAPTCHA`}
            </Href>
        );

        switch (modalModel.imap) {
            case IMAPS.GMAIL:
                if (isReconnect) {
                    message = (
                        <>
                            <div className="mb1">{c('Import error')
                                .t`Proton can't connect to your account. Please make sure that Gmail IMAP access is enabled.`}</div>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`If ${bold2StepsDisabled} in Gmail (default settings), please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`your password is correct`}</li>
                                <li>{c('Import error')
                                    .t`"Less secure app access" is turned on in your Google account security settings`}</li>
                            </ul>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`If ${bold2StepsEnabled} in Gmail, please make sure that you are using your app password instead of your regular password.`}
                            </div>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`You can also try to sign out of ${boldGoogleAccounts} in the browser, then unlock ${linkCAPTCHA}.`}
                            </div>
                        </>
                    );
                }

                if (isIMAPError) {
                    message = c('Import error')
                        .t`Proton can't connect to your Gmail account. Please make sure that the mail server address and port number are correct.`;
                }

                if (isAuthError) {
                    message = (
                        <>
                            <div className="mb1">{c('Import error')
                                .t`Proton can't connect to your account. Please make sure that IMAP access is enabled in your Gmail account.`}</div>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`If ${bold2StepsDisabled} (default Gmail settings), please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`your email address and password are correct`}</li>
                                <li>{c('Import error')
                                    .t`"Less secure app access" is turned on in your Google account security settings`}</li>
                            </ul>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`If ${bold2StepsEnabled}, please make sure that your email address and app password are correct. Do ${boldNot} use your regular password.`}
                            </div>
                            <div className="mb1">
                                {c('Import error')
                                    .jt`You can also try to sign out of ${boldGoogleAccounts} in the browser, then unlock ${linkCAPTCHA}.`}
                            </div>
                        </>
                    );
                }

                break;
            case IMAPS.YAHOO:
                if (isReconnect) {
                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`Proton can't connect to your Yahoo Mail account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your Yahoo account`}</li>
                                <li>{c('Import error')
                                    .jt`your app password is correct. Do ${boldNot} use your regular password`}</li>
                            </ul>
                        </>
                    );
                }

                if (isIMAPError) {
                    message = c('Import error')
                        .t`Proton can't connect to your Yahoo Mail account. Please make sure that the mail server address and port number are correct.`;
                }

                if (isAuthError) {
                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`Proton can't connect to your external account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error')
                                    .jt`your email address and app password are correct. Do ${boldNot} use your regular password`}</li>
                                <li>{c('Import error').t`IMAP access is enabled in your Yahoo account`}</li>
                            </ul>
                        </>
                    );
                }

                break;
            default:
                if (isReconnect) {
                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error').t`Proton can't connect to your account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your external account`}</li>
                                <li>{c('Import error').t`your password is correct`}</li>
                            </ul>
                            <div className="mb1">{c('Import error').t`Use your app password if:`}</div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`2-step verification is enabled in your external account`}</li>
                                <li>{c('Import error').t`your email account requires one to export your data`}</li>
                            </ul>
                        </>
                    );
                }

                if (isIMAPError) {
                    message = c('Import error')
                        .t`Proton can't connect to your external account. Please make sure that the mail server address and port number are correct.`;
                }

                if (isAuthError) {
                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`Proton can't connect to your external account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your external account`}</li>
                                <li>{c('Import error').t`your email address and password are correct`}</li>
                            </ul>
                            <div className="mb1">
                                {c('Import error').t`Use your app password instead of your regular password if:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error')
                                    .t`2-step verification is enabled in your external email account`}</li>
                                <li>{c('Import error')
                                    .t`your email account requires an app password to export your data`}</li>
                            </ul>
                        </>
                    );
                }
                break;
        }

        return (
            <Alert
                type="error"
                learnMore={
                    isReconnect
                        ? 'https://protonmail.com/support/knowledge-base/import-assistant/#reconnection-errors'
                        : 'https://protonmail.com/support/knowledge-base/import-assistant/#common-questions-and-import-errors'
                }
            >
                {message}
            </Alert>
        );
    };

    return (
        <>
            {isReconnect || [IMPORT_ERROR.AUTH_IMAP, IMPORT_ERROR.AUTH_CREDENTIALS].includes(errorCode) ? (
                renderError()
            ) : (
                <>
                    <Alert>{c('Info').t`Enter the credentials of the email account you want to import from.`}</Alert>
                    {showPassword && (
                        <Alert type="warning" learnMore="https://protonmail.com/privacy-policy/">
                            {c('Warning')
                                .t`By sharing your login credentials, you are giving Proton permission to fetch data from your external email provider. We will delete your login information once the import is complete.`}
                        </Alert>
                    )}
                </>
            )}

            <Row>
                <Label htmlFor="emailAddress">{c('Label').t`Email`}</Label>
                <Field>
                    <EmailInput
                        id="emailAddress"
                        value={email}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            updateModalModel({ ...modalModel, email: target.value })
                        }
                        autoFocus
                        required
                        disabled={isReconnect}
                        isSubmitted={!!errorLabel}
                        error={isAuthError ? errorLabel : undefined}
                        errorZoneClassName="hidden"
                    />
                </Field>
            </Row>

            {showPassword && (
                <Row>
                    <Label htmlFor="password">
                        {needAppPassword ? c('Label').t`App password` : c('Label').t`Password`}
                    </Label>
                    <Field>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                updateModalModel({ ...modalModel, password: target.value })
                            }
                            autoFocus
                            required
                            isSubmitted={!!errorLabel}
                            error={isAuthError ? errorLabel : undefined}
                            errorZoneClassName="hidden"
                        />
                    </Field>
                </Row>
            )}
            {needIMAPDetails && email && showPassword && (
                <>
                    <Row>
                        <Label htmlFor="imap">{c('Label').t`Mail Server (IMAP)`}</Label>
                        <Field>
                            <Input
                                id="imap"
                                placeholder="imap.domain.com"
                                value={imap}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                                    updateModalModel({ ...modalModel, imap: target.value });
                                }}
                                required
                                isSubmitted={!!errorLabel}
                                error={isIMAPError ? errorLabel : undefined}
                                errorZoneClassName="hidden"
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="port">{c('Label').t`Port`}</Label>
                        <Field>
                            <Input
                                id="port"
                                placeholder="993"
                                value={port}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    updateModalModel({ ...modalModel, port: target.value })
                                }
                                required
                                isSubmitted={!!imapPortError}
                                error={imapPortError}
                                errorZoneClassName="hidden"
                            />
                        </Field>
                    </Row>
                </>
            )}
        </>
    );
};

export default ImportStartStep;
