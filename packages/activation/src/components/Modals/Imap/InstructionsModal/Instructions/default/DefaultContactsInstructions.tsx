import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const DefaultContactsInstructions = () => {
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download this before you start the import process."
    const knowledgeBaseLink = (
        <Href href={getKnowledgeBaseUrl('/exporting-contacts-from-other-mail-providers')} key="knowledgeBaseLink">
            {c('Import instructions link').t`CSV or a VCF (vCard) file`}
        </Href>
    );
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download this before you start the import process."
    const defaultContactsMessage = c('Import instructions')
        .jt`To import contacts to ${BRAND_NAME}, you need a ${knowledgeBaseLink}. Download this before you start the import process.`;

    return (
        <div className="mb-4" data-testid="Instruction:defaultContactInstructions">
            {defaultContactsMessage}
        </div>
    );
};

export default DefaultContactsInstructions;
