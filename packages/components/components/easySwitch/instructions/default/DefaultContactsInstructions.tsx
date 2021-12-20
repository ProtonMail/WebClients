import { c } from 'ttag';

import { Href } from '../../../link';

const DefaultContactsInstructions = () => {
    // translator: full sentence: "To import contacts to Proton, you need a CSV file. Download this before you start the import process."
    const knowledgeBaseLink = (
        <Href
            url="https://protonmail.com/support/knowledge-base/exporting-contacts-from-other-mail-providers/"
            key="knowledgeBaseLink"
        >
            {c('Import instructions link').t`CSV file`}
        </Href>
    );
    // translator: full sentence: "To import contacts to Proton, you need a CSV file. Download this before you start the import process."
    const defaultContactsMessage = c('Import instructions')
        .jt`To import contacts to Proton, you need a ${knowledgeBaseLink}. Download this before you start the import process`;

    return <div className="mb1">{defaultContactsMessage}</div>;
};

export default DefaultContactsInstructions;
