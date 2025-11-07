import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const YahooMailInstructions = () => {
    // translator: full sentence: "To import emails to Proton, you need an app password from Yahoo. Get it by following these steps:"
    const appPasswordLink = (
        <Href href={getKnowledgeBaseUrl('/allowing-imap-access-and-entering-imap-details')} key="appPasswordLink">
            {c('Import instructions link').t`app password`}
        </Href>
    );
    // translator: full sentence: "To import emails to Proton, you need an app password from Yahoo. Get it by following these steps:"
    const yahooAppPasswordMessage = c('Import instructions')
        .jt`To import emails to ${BRAND_NAME}, you need an ${appPasswordLink} from Yahoo. Get it by following these steps:`;

    // translator: full sentence: "Go to account info under your profile in Yahoo"
    const boldAccountInfo = <strong key="boldAccountInfo">{c('Import instructions emphasis').t`Account info`}</strong>;
    // translator: full sentence: "Go to account info under your profile in Yahoo"
    const yahooMailLink = (
        <Href href="https://mail.yahoo.com/" key="yahooMailLink">
            {c('Import instructions link').t`Yahoo`}
        </Href>
    );
    // translator: full sentence: "Go to account info under your profile in Yahoo"
    const step1 = c('Import instructions').jt`Go to ${boldAccountInfo} under your profile in ${yahooMailLink}.`;

    // translator: full sentence: "Go to Account security"
    const boldAccountSecurity = (
        <strong key="boldAccountSecurity">{c('Import instructions emphasis').t`Account security`}</strong>
    );
    // translator: full sentence: "Go to Account security"
    const step2 = c('Import instructions').jt`Go to ${boldAccountSecurity}.`;

    // translator: full sentence: "Generate the app password and use it in place of your regular password when prompted by Proton"
    const boldAppPassword = (
        <strong key="boldAccountSecurity">{c('Import instructions emphasis').t`app password`}</strong>
    );
    // translator: full sentence: "Generate the app password and use it in place of your regular password when prompted by Proton"
    const step3 = c('Import instructions')
        .jt`Generate the ${boldAppPassword} and use it in place of your regular password when prompted by ${BRAND_NAME}.`;

    return (
        <>
            <div className="mb-4" data-testid="Instruction:yahooMailInstructions">
                {yahooAppPasswordMessage}
            </div>

            <ol className="pl-4 mx-8">
                <li className="mb-2">{step1}</li>
                <li className="mb-2">{step2}</li>
                <li className="mb-2">{step3}</li>
            </ol>
        </>
    );
};

export default YahooMailInstructions;
