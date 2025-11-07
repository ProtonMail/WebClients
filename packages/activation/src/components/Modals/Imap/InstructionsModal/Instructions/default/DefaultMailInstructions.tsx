import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const DefaultMailInstructions = () => {
    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton."
    const knowledgeBaseLink = (
        <Href href={getKnowledgeBaseUrl('/allowing-imap-access-and-entering-imap-details')} key="knowledgeBaseLink">
            {c('Import instructions link').t`app password or enable IMAP`}
        </Href>
    );

    // translator: full sentence: "Depending on your email service provider, you may need to generate an app password or enable IMAP first before you can import to Proton."
    const defaultAppPasswordMessage = c('Import instructions')
        .jt`Depending on your email service provider, you may need to generate an ${knowledgeBaseLink} first before you can import to ${BRAND_NAME}.`;

    return (
        <div className="mb-4" data-testid="Instruction:defaultMailInstructions">
            {defaultAppPasswordMessage}
        </div>
    );
};

export default DefaultMailInstructions;
