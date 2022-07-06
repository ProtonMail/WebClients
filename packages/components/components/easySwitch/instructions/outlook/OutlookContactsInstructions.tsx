import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../../link';

const OutlookContactsInstructions = () => {
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download it from Outlook in 3 easy steps:"
    const knowledgeBaseLink = (
        <Href url={getKnowledgeBaseUrl('/exporting-contacts-from-other-mail-providers')} key="knowledgeBaseLink">
            {c('Import instructions link').t`CSV or a VCF (vCard) file`}
        </Href>
    );
    // translator: full sentence: "To import contacts to Proton, you need a CSV or a VCF (vCard) file. Download it from Outlook in 3 easy steps:"
    const outlookContactsMessage = c('Import instructions')
        .jt`To import contacts to Proton, you need a ${knowledgeBaseLink}. Download it from Outlook in 3 easy steps:`;

    // translator: full sentence: "Open your Outlook contacts"
    const outlookContactsLink = (
        <Href url="https://outlook.live.com/people/" key="outlookContactsLink">
            {c('Import instructions link').t`contacts`}
        </Href>
    );
    // translator: full sentence: "Open your Outlook contacts"
    const step1 = c('Import instructions').jt`Open your Outlook ${outlookContactsLink}.`;

    // translator: full sentence: "Click Manage to expand the options menu"
    const boldManage = <strong key="boldManage">{c('Import instructions emphasis').t`Manage`}</strong>;
    // translator: full sentence: "Click Manage to expand the options menu"
    const step2 = c('Import instructions').jt`Click ${boldManage} to expand the options menu.`;

    // translator: full sentence: "Select Export contacts and choose which contacts to export."
    const boldExportContacts = (
        <strong key="boldExportContacts">{c('Import instructions emphasis').t`Export contacts`}</strong>
    );
    // translator: full sentence: "Select Export contacts and choose which contacts to export."
    const step3 = c('Import instructions').jt`Select ${boldExportContacts} and choose which contacts to export.`;

    return (
        <>
            <div className="mb1">{outlookContactsMessage}</div>

            <ol className="pl1 ml2 mr2">
                <li className="mb0-5">{step1}</li>
                <li className="mb0-5">{step2}</li>
                <li className="mb0-5">{step3}</li>
            </ol>
        </>
    );
};

export default OutlookContactsInstructions;
