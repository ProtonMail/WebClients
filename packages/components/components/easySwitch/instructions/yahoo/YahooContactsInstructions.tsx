import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../../link';

const YahooContactsInstructions = () => {
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download it from Yahoo in 3 easy steps:"
    const knowledgeBaseLink = (
        <Href url={getKnowledgeBaseUrl('/exporting-contacts-from-other-mail-providers')} key="knowledgeBaseLink">
            {c('Import instructions link').t`CSV or a VCF (vCard) file`}
        </Href>
    );
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download it from Yahoo in 3 easy steps:"
    const yahooCalendarMessage = c('Import instructions')
        .jt`To import contacts to Proton, you need a ${knowledgeBaseLink}. Download it from Yahoo in 3 easy steps:`;

    // translator: full sentence: "Open your Yahoo contacts":
    const yahooMailLink = (
        <Href url="https://mail.yahoo.com/" key="yahooMailLink">
            {c('Import instructions link').t`Yahoo`}
        </Href>
    );
    // translator: full sentence: "Open your Yahoo contacts"
    const step1 = c('Import instructions').jt`Open your ${yahooMailLink} contacts.`;

    const step2 = c('Import instructions').t`Expand the dropdown menu by clicking on the 3 dots (...).`;

    // translator: full sentence: "Select Export to CSV file"
    const boldExportCSV = (
        <strong key="boldExportCSV">{c('Import instructions emphasis').t`Export to CSV file`}</strong>
    );
    // translator: full sentence: "Select Export to CSV file"
    const step3 = c('Import instructions').jt`Select ${boldExportCSV}.`;

    return (
        <>
            <div className="mb1">{yahooCalendarMessage}</div>

            <ol className="pl1 ml2 mr2">
                <li className="mb0-5">{step1}</li>
                <li className="mb0-5">{step2}</li>
                <li className="mb0-5">{step3}</li>
            </ol>
        </>
    );
};
export default YahooContactsInstructions;
