import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../../link';

const DefaultContactsInstructions = () => {
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download this before you start the import process."
    const knowledgeBaseLink = (
        <Href url={getKnowledgeBaseUrl('/exporting-contacts-from-other-mail-providers')} key="knowledgeBaseLink">
            {c('Import instructions link').t`CSV or a VCF (vCard) file`}
        </Href>
    );
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download this before you start the import process."
    const defaultContactsMessage = c('Import instructions')
        .jt`To import contacts to Proton, you need a ${knowledgeBaseLink}. Download this before you start the import process.`;

    return <div className="mb1">{defaultContactsMessage}</div>;
};

export default DefaultContactsInstructions;
