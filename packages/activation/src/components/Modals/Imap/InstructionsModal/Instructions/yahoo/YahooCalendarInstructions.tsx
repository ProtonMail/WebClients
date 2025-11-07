import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const YahooCalendarInstructions = () => {
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download it from Yahoo in 3 easy steps:"
    const knowledgeBaseLink = (
        <Href href={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)} key="knowledgeBaseLink">
            {c('Import instructions link').t`ICS file`}
        </Href>
    );
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download it from Yahoo in 3 easy steps:"
    const yahooCalendarMessage = c('Import instructions')
        .jt`To import a calendar to ${BRAND_NAME}, you need the ${knowledgeBaseLink}. Download it from Yahoo in 3 easy steps:`;

    // translator: full sentence: "Go to full calendar view in Yahoo"
    const calendarViewLink = (
        <Href href="https://calendar.yahoo.com/" key="calendarViewLink">
            {c('Import instructions link').t`full calendar view`}
        </Href>
    );
    // translator: full sentence: "Go to full calendar view in Yahoo"
    const step1 = c('Import instructions step').jt`Go to ${calendarViewLink} in Yahoo.`;

    const step2 = c('Import instructions step')
        .t`Mouse over the calendar you want to import and open the dropdown menu.`;

    // translator: full sentence: "Select Export to export the calendar as an ICS file"
    const boldExport = <strong key="boldExport">{c('Import instructions emphasis').t`Export`}</strong>;
    // translator: full sentence: "Select Export to export the calendar as an ICS file"
    const step3 = c('Import instructions step').jt`Select ${boldExport} to export the calendar as an ICS file.`;

    return (
        <>
            <div className="mb-4" data-testid="Instruction:yahooCalendarInstructions">
                {yahooCalendarMessage}
            </div>

            <ol className="pl-4 mx-8">
                <li className="mb-2">{step1}</li>
                <li className="mb-2">{step2}</li>
                <li className="mb-2">{step3}</li>
            </ol>
        </>
    );
};
export default YahooCalendarInstructions;
