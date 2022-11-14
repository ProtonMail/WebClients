import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../../link';

const OutlookMailInstructions = () => {
    // translator: full sentence: "To import emails to Proton, you need an app password from Outlook. Get it by following these steps:"
    const appPasswordLink = (
        <Href url={getKnowledgeBaseUrl('/allowing-imap-access-and-entering-imap-details')} key="appPasswordLink">
            {c('Import instructions link').t`app password`}
        </Href>
    );
    // translator: full sentence: "To import emails to Proton, you need an app password from Outlook. Get it by following these steps:"
    const outlookAppPasswordMessage = c('Import instructions')
        .jt`To import emails to ${BRAND_NAME}, you need an ${appPasswordLink} from Outlook. Get it by following these steps:`;

    // translator: full sentence: "Go to Outlook security settings"
    const securitySettingsLink = (
        <Href url="https://account.live.com/proofs/manage/additional/" key="securitySettingsLink">
            {c('Import instructions link').t`security settings`}
        </Href>
    );
    // translator: full sentence: "Go to Outlook security settings"
    const step1 = c('Import instructions').jt`Go to Outlook ${securitySettingsLink}.`;

    const step2 = c('Import instructions').t`If 2-step verification is off, turn it on.`;

    // translator: full sentence: "Generate an app password and use it in place of your regular password when prompted by Proton":
    const boldAppPassword = (
        <strong key="boldAccountSecurity">{c('Import instructions emphasis').t`app password`}</strong>
    );
    // translator: full sentence: "Generate an app password and use it in place of your regular password when prompted by Proton"
    const step3 = c('Import instructions')
        .jt`Generate an ${boldAppPassword} and use it in place of your regular password when prompted by ${BRAND_NAME}.`;

    return (
        <>
            <div className="mb1">{outlookAppPasswordMessage}</div>

            <ol className="pl1 ml2 mr2">
                <li className="mb0-5">{step1}</li>
                <li className="mb0-5">{step2}</li>
                <li className="mb0-5">{step3}</li>
            </ol>
        </>
    );
};

export default OutlookMailInstructions;
