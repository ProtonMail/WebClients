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

const StepFormErrorYahoo = ({ isReconnect, errorCode }: Props) => {
    if (!isReconnect && !errorCode) {
        return null;
    }

    const boldNot = <strong key="boldNot">{c('Import error emphasis').t`not`}</strong>;

    const learnMoreUrl =
        errorCode !== RATE_LIMIT_EXCEEDED ? getKnowledgeBaseUrl('/troubleshooting-easy-switch/') : undefined;
    return (
        <Alert className="mb-4" type="error">
            {isReconnect === true && (
                <>
                    <div className="mb-4">
                        {c('Import error').t`${BRAND_NAME} can't connect to your Yahoo account. Please make sure that:`}
                    </div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error').t`IMAP access is enabled in your Yahoo account.`}</li>
                        <li>{
                            // // translator: the variable here is a HTML tag, here is the complete sentence: "your app password is correct. Do not use your regular password"
                            c('Import error').jt`Your app password is correct. Do ${boldNot} use your regular password.`
                        }</li>
                    </ul>
                </>
            )}
            {[IMAP_CONNECTION_ERROR, ACCOUNT_DOES_NOT_EXIST].some((error) => error === errorCode) && (
                <>{c('Import error')
                    .t`${BRAND_NAME} can't connect to your Yahoo account. Please make sure that the mail server address and port number are correct.`}</>
            )}
            {errorCode === AUTHENTICATION_ERROR && (
                <>
                    <div className="mb-4" data-testid="StepForm:yahooAuthError">
                        {c('Import error')
                            .t`${BRAND_NAME} can't connect to your external account. Please make sure that:`}
                    </div>
                    <ul className="m-0 pb-4">
                        <li>{c('Import error')
                            .jt`Your email address and app password are correct. Do ${boldNot} use your regular password.`}</li>
                        <li>{c('Import error').t`IMAP access is enabled in your Yahoo account.`}</li>
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

export default StepFormErrorYahoo;
