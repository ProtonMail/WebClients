import { c } from 'ttag';

import { IMPORT_ERROR } from '@proton/activation/src/interface';
import { Href } from '@proton/atoms';
import { Alert } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    isReconnect: boolean;
    errorCode?: IMPORT_ERROR;
}

const { RATE_LIMIT_EXCEEDED, ACCOUNT_DOES_NOT_EXIST, IMAP_CONNECTION_ERROR, AUTHENTICATION_ERROR } = IMPORT_ERROR;

const StepFormErrorDefault = ({ isReconnect, errorCode }: Props) => {
    if (!isReconnect && !errorCode) {
        return null;
    }

    const learnMoreUrl =
        errorCode !== RATE_LIMIT_EXCEEDED ? getKnowledgeBaseUrl('/troubleshooting-easy-switch/') : undefined;

    return (
        <Alert className="mb-4" type="error">
            {isReconnect === true && (
                <>
                    <div className="mb-4">
                        {c('Import error').t`${BRAND_NAME} can't connect to your account. Please make sure that:`}
                    </div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error').t`IMAP access is enabled in your external account.`}</li>
                        <li>{c('Import error').t`Your password is correct.`}</li>
                    </ul>
                    <div className="mb-4">{c('Import error').t`Use your app password if:`}</div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error').t`2-step verification is enabled in your external account.`}</li>
                        <li>{c('Import error').t`Your email account requires one to export your data.`}</li>
                    </ul>
                </>
            )}
            {[IMAP_CONNECTION_ERROR, ACCOUNT_DOES_NOT_EXIST].some((error) => error === errorCode) && (
                <>{c('Import error')
                    .t`${BRAND_NAME} can't connect to your external account. Please make sure that the mail server address and port number are correct.`}</>
            )}
            {errorCode === AUTHENTICATION_ERROR && (
                <>
                    <div className="mb-4">
                        {c('Import error')
                            .t`${BRAND_NAME} can't connect to your external account. Please make sure that:`}
                    </div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error').t`IMAP access is enabled in your external account.`}</li>
                        <li>{c('Import error').t`Your email address and password are correct.`}</li>
                    </ul>
                    <div className="mb-4">
                        {c('Import error').t`Use your app password instead of your regular password if:`}
                    </div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error').t`2-step verification is enabled in your external email account.`}</li>
                        <li>{c('Import error').t`Your email account requires an app password to export your data.`}</li>
                    </ul>
                </>
            )}
            {errorCode === RATE_LIMIT_EXCEEDED &&
                c('Import error').t`Too many recent requests. Please try again in a few moments.`}

            {learnMoreUrl && (
                <div>
                    <Href href={learnMoreUrl}>{c('Link').t`Learn more`}</Href>
                </div>
            )}
        </Alert>
    );
};

export default StepFormErrorDefault;
