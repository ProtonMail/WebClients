import { c } from 'ttag';

import yahooContactsScreenshot from '@proton/styles/assets/img/import/instructions/yahoo-contacts.png';

const YahooContactsInstructions = () => {
    const boldExportCSV = (
        <strong key="boldExportCSV">{c('Import instructions emphasis').t`Export to CSV file`}</strong>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Log into Yahoo Mail and click on the first icon on the right sidebar to display the contacts panel. Click on the three dots to display the Contacts options and click on Export to CSV file. This is the file you will upload to Proton during the import."
    const yahooCalendarMessage = c('Import instructions')
        .jt`Log into Yahoo Mail and click on the first icon on the right sidebar to display the contacts panel. Click on the three dots to display the Contacts options and click on ${boldExportCSV}. This is the file you will upload to Proton during the import.`;

    return (
        <>
            <div className="mb1">{yahooCalendarMessage}</div>
            <div className="text-center">
                <img
                    className="border--currentColor"
                    src={yahooContactsScreenshot}
                    alt={c('Import instructions image alternative text')
                        .t`Instructions to export your contacts from Yahoo Mail`}
                />
            </div>
        </>
    );
};
export default YahooContactsInstructions;
