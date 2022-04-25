import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Href } from '../../../link';

const DefaultMailInstructions = () => {
    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton."
    const knowledgeBaseLink = (
        <Href url={getKnowledgeBaseUrl('/allowing-imap-access-and-entering-imap-details/')} key="knowledgeBaseLink">
            {c('Import instructions link').t`app password or enable IMAP`}
        </Href>
    );

    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton."
    const defaultAppPasswordMessage = c('Import instructions')
        .jt`Depending on your email service provider, you may need to generate an ${knowledgeBaseLink} first before you can import to Proton`;

    return <div className="mb1">{defaultAppPasswordMessage}</div>;
};

export default DefaultMailInstructions;
