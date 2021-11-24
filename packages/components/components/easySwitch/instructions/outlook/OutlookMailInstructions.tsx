import { c } from 'ttag';

import outlookMailScreenshot from '@proton/styles/assets/img/import/instructions/outlook-mail.png';

import { Href } from '../../../link';

const OutlookMailInstructions = () => {
    const directLink = (
        <Href url="https://account.live.com/proofs/manage/additional/" key="directLink">
            {c('Import instructions link').t`Additional security options`}
        </Href>
    );

    const boldLink = <strong key="boldLink">{c('Import instructions emphasis').t`Create a new app password`}</strong>;

    // translator: the variables here are HTML tags, here is the complete sentence: "Visit the Additional security options in your Microsoft account. From there, scroll to App passwords and select Create a new app password. Outlook will automatically generate your password. You will need this password during the import."
    const outlookAppPasswordMessage = c('Import instructions')
        .jt`Visit the ${directLink} of your Microsoft account. From there, scroll to App passwords and select ${boldLink}. Outlook will automatically generate your password. You will need this password during the import.`;

    return (
        <>
            <div className="mb1">{outlookAppPasswordMessage}</div>
            <div className="text-center">
                <img
                    className="border--currentColor"
                    src={outlookMailScreenshot}
                    alt={c('Import instructions image alternative text')
                        .t`Instructions to create an app password in Outlook account settings`}
                />
            </div>
        </>
    );
};

export default OutlookMailInstructions;
