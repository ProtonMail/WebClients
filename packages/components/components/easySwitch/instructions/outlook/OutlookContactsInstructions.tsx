import { c } from 'ttag';

import outlookContactsScreenshot from '@proton/styles/assets/img/import/instructions/outlook-contacts.png';

import { Href } from '../../../link';

const OutlookContactsInstructions = () => {
    const outlookPeopleLink = (
        <Href url="https://outlook.live.com/people/" key="outlookPeopleLink">
            {c('Import instructions link').t`People page on Outlook.com`}
        </Href>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Visit the People page on Outlook.com. On the far right of the top toolbar, select Manage → Export contacts, choose which contacts you wish to export and click Export to export them as a CSV file. This is the file you will upload to Proton during the import."
    const outlookContactsMessage = c('Import instructions')
        .jt`Visit the ${outlookPeopleLink}. On the far right of the top toolbar, select Manage → Export contacts, choose which contacts you wish to export and click Export to export them as a CSV file. This is the file you will upload to Proton during the import.`;

    return (
        <>
            <div className="mb1">{outlookContactsMessage}</div>
            <div className="text-center">
                <img
                    className="border--currentColor"
                    src={outlookContactsScreenshot}
                    alt={c('Import instructions image alternative text')
                        .t`Instructions to export your contacts from Outlook.com`}
                />
            </div>
        </>
    );
};

export default OutlookContactsInstructions;
