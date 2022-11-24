import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    IMPORT_ERROR,
    ImportError,
    NON_OAUTH_PROVIDER,
    NormalizedImporter,
} from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, Field, InputTwo, Label, PasswordInputTwo, Row } from '../../../../../components';
import { EASY_SWITCH_EMAIL_PLACEHOLDER, IMAPS } from '../../../constants';
import { ImportMailModalModel } from '../../interfaces';

interface Props {
    modalModel: ImportMailModalModel;
    updateModalModel: (newModel: ImportMailModalModel) => void;
    currentImport?: NormalizedImporter;
    invalidPortError: boolean;
    provider?: NON_OAUTH_PROVIDER;
}

const ImportStartStep = ({ modalModel, updateModalModel, currentImport, invalidPortError, provider }: Props) => {
    const { email, password, imap, port, errorCode, errorLabel } = modalModel;
    const needAppPassword = provider === NON_OAUTH_PROVIDER.YAHOO;
    const isRateLimitError = errorCode === IMPORT_ERROR.RATE_LIMIT_EXCEEDED;
    const isAuthError = errorCode === IMPORT_ERROR.AUTHENTICATION_ERROR;
    const isIMAPError = errorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR;

    const isReconnect = currentImport?.Active?.ErrorCode === ImportError.ERROR_CODE_IMAP_CONNECTION;

    let imapPortError = isIMAPError ? errorLabel : undefined;

    if (invalidPortError) {
        imapPortError = c('Import error').t`Invalid IMAP port`;
    }

    const renderError = () => {
        let message = null;
        const boldNot = <strong key="boldNot">{c('Import error emphasis').t`not`}</strong>;

        switch (modalModel.imap) {
            case IMAPS[NON_OAUTH_PROVIDER.YAHOO]:
                if (isReconnect) {
                    // translator: the variable here is a HTML tag, here is the complete sentence: "your app password is correct. Do not use your regular password"
                    const appPasswordIsCorrectMessage = c('Import error')
                        .jt`Your app password is correct. Do ${boldNot} use your regular password.`;

                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`${BRAND_NAME} can't connect to your Yahoo account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your Yahoo account.`}</li>
                                <li>{appPasswordIsCorrectMessage}</li>
                            </ul>
                        </>
                    );
                }

                if (isIMAPError) {
                    message = c('Import error')
                        .t`${BRAND_NAME} can't connect to your Yahoo account. Please make sure that the mail server address and port number are correct.`;
                }

                if (isAuthError) {
                    // translator: the variable here is a HTML tag, here is the complete sentence: "your email address and app password are correct. Do not use your regular password"
                    const credentialsAreCorrectMessage = c('Import error')
                        .jt`Your email address and app password are correct. Do ${boldNot} use your regular password.`;

                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`${BRAND_NAME} can't connect to your external account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{credentialsAreCorrectMessage}</li>
                                <li>{c('Import error').t`IMAP access is enabled in your Yahoo account.`}</li>
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
                                {c('Import error')
                                    .t`${BRAND_NAME} can't connect to your account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your external account.`}</li>
                                <li>{c('Import error').t`Your password is correct.`}</li>
                            </ul>
                            <div className="mb1">{c('Import error').t`Use your app password if:`}</div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`2-step verification is enabled in your external account.`}</li>
                                <li>{c('Import error').t`Your email account requires one to export your data.`}</li>
                            </ul>
                        </>
                    );
                }

                if (isIMAPError) {
                    message = c('Import error')
                        .t`${BRAND_NAME} can't connect to your external account. Please make sure that the mail server address and port number are correct.`;
                }

                if (isAuthError) {
                    message = (
                        <>
                            <div className="mb1">
                                {c('Import error')
                                    .t`${BRAND_NAME} can't connect to your external account. Please make sure that:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error').t`IMAP access is enabled in your external account.`}</li>
                                <li>{c('Import error').t`Your email address and password are correct.`}</li>
                            </ul>
                            <div className="mb1">
                                {c('Import error').t`Use your app password instead of your regular password if:`}
                            </div>
                            <ul className="m0 pb1">
                                <li>{c('Import error')
                                    .t`2-step verification is enabled in your external email account.`}</li>
                                <li>{c('Import error')
                                    .t`Your email account requires an app password to export your data.`}</li>
                            </ul>
                        </>
                    );
                }
                break;
        }

        if (isRateLimitError) {
            message = c('Import error').t`Too many recent requests. Please try again in a few moments.`;
        }

        const learnMoreLink = getKnowledgeBaseUrl('/troubleshooting-easy-switch/');

        return (
            <Alert className="mb1" type="error" learnMore={isRateLimitError ? undefined : learnMoreLink}>
                {message}
            </Alert>
        );
    };

    return (
        <>
            {isReconnect ||
            [
                IMPORT_ERROR.AUTHENTICATION_ERROR,
                IMPORT_ERROR.IMAP_CONNECTION_ERROR,
                IMPORT_ERROR.RATE_LIMIT_EXCEEDED,
            ].includes(errorCode) ? (
                renderError()
            ) : (
                <div className="mb1">
                    {c('Info').t`Enter the credentials of the email account you want to import from.`}
                    <br />
                    {c('Info').t`Your login information will not be saved after the import is completed.`}
                </div>
            )}
            <Row>
                <Label htmlFor="emailAddress">{c('Label').t`Email`}</Label>
                <Field>
                    <InputTwo
                        id="emailAddress"
                        value={email}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            updateModalModel({ ...modalModel, email: target.value })
                        }
                        autoFocus
                        required
                        disabled={isReconnect}
                        error={isAuthError ? errorLabel : undefined}
                        placeholder={provider && EASY_SWITCH_EMAIL_PLACEHOLDER[provider]}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="password">
                    {needAppPassword ? c('Label').t`App password` : c('Label').t`Password`}
                </Label>
                <Field>
                    <PasswordInputTwo
                        id="password"
                        value={password}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            updateModalModel({ ...modalModel, password: target.value })
                        }
                        required
                        error={isAuthError ? errorLabel : undefined}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="imap">{c('Label').t`Mail Server (IMAP)`}</Label>
                <Field>
                    <InputTwo
                        id="imap"
                        placeholder="imap.domain.com"
                        value={imap}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                            updateModalModel({ ...modalModel, imap: target.value });
                        }}
                        required
                        error={isIMAPError ? errorLabel : undefined}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="port">{c('Label').t`Port`}</Label>
                <Field>
                    <InputTwo
                        id="port"
                        placeholder="993"
                        value={port}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            updateModalModel({ ...modalModel, port: target.value })
                        }
                        required
                        error={imapPortError}
                    />
                </Field>
            </Row>
        </>
    );
};

export default ImportStartStep;
