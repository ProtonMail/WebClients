import { c } from 'ttag';

import { Href } from '../../../link';

const DefaultMailInstructions = () => {
    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton. Learn more about importing emails to Proton."
    const knowledgeBaseLink = (
        <Href
            url="https://protonmail.com/support/knowledge-base/allowing-imap-access-and-entering-imap-details/"
            key="knowledgeBaseLink"
        >
            {c('Import instructions link').t`importing emails`}
        </Href>
    );

    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton. Learn more about importing emails to Proton."
    const defaultAppPasswordMessage = c('Import instructions')
        .jt`Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton. Learn more about ${knowledgeBaseLink} to Proton.`;

    return <div className="mb1">{defaultAppPasswordMessage}</div>;
};

export default DefaultMailInstructions;
