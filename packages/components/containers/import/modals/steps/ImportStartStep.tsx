import React, { ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';

import { Alert, Row, Label, Field, PasswordInput, EmailInput, Input } from '../../../../components';

import {
    INVALID_CREDENTIALS_ERROR_LABEL,
    IMAP_AUTHENTICATION_ERROR_LABEL,
    IMAP_CONNECTION_ERROR_LABEL,
} from '../../constants';
import { ImportModalModel, IMPORT_ERROR } from '../../interfaces';

interface Props {
    modalModel: ImportModalModel;
    updateModalModel: (newModel: ImportModalModel) => void;
    needAppPassword: boolean;
    showPassword: boolean;
    reconnectMode: boolean;
}

const ImportStartStep = ({ modalModel, updateModalModel, needAppPassword, showPassword, reconnectMode }: Props) => {
    const { email, password, needIMAPDetails, imap, port, errorCode, errorLabel } = modalModel;

    useEffect(() => {
        if (!email) {
            updateModalModel({ ...modalModel, password: '', port: '', imap: '' });
        }
    }, [email]);

    const authError = [INVALID_CREDENTIALS_ERROR_LABEL, IMAP_AUTHENTICATION_ERROR_LABEL].includes(errorLabel);

    return (
        <>
            {reconnectMode || [IMPORT_ERROR.AUTH_IMAP, IMPORT_ERROR.AUTH_CREDENTIALS].includes(errorCode) ? (
                <Alert type="error" learnMore="https://protonmail.com/support/knowledge-base/">
                    {(authError || reconnectMode) && (
                        <>
                            <div className="mb1">
                                {c('Error')
                                    .t`Proton cannot connect to your email server provider. Please make sure you:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Error').t`enabled IMAP access on your external account`}</li>
                                <li>{c('Error').t`entered the correct email address and password`}</li>
                            </ul>
                        </>
                    )}
                    {errorLabel === IMAP_CONNECTION_ERROR_LABEL && (
                        <>
                            <div className="mb1">
                                {c('Error').t`Proton cannot connect to your email server provider. Please make sure:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Error').t`IMAP access on your external account is enabled`}</li>
                                <li>{c('Error').t`the mail server address and port number are correct`}</li>
                            </ul>
                        </>
                    )}
                </Alert>
            ) : (
                <>
                    <Alert>{c('Info').t`Enter the address of the email account you want to import from`}</Alert>
                    {showPassword && (
                        <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/">
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
                        disabled={reconnectMode}
                        isSubmitted={!!errorLabel}
                        error={authError ? errorLabel : undefined}
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
                            error={authError ? errorLabel : undefined}
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
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    updateModalModel({ ...modalModel, imap: target.value })
                                }
                                required
                                isSubmitted={!!errorLabel}
                                error={errorLabel === IMAP_CONNECTION_ERROR_LABEL ? errorLabel : undefined}
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
                                isSubmitted={!!errorLabel}
                                error={errorLabel === IMAP_CONNECTION_ERROR_LABEL ? errorLabel : undefined}
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
