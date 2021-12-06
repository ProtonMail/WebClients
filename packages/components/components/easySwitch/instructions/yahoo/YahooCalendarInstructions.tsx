import { c } from 'ttag';

import { Href } from '../../../link';

const YahooCalendarInstructions = () => {
    const yahooCalendarMessage = c('Import instructions')
        .t`To import a calendar to Proton, you need the ICS file. Download it from Yahoo in 3 easy steps:`;

    // translator: full sentence: "Go to full calendar view in Yahoo Mail"
    const calendarViewLink = (
        <Href url="https://calendar.yahoo.com/" key="calendarViewLink">
            {c('Import instructions link').t`full calendar view`}
        </Href>
    );
    // translator: full sentence: "Go to full calendar view in Yahoo Mail"
    const step1 = c('Import instructions step').jt`Go to ${calendarViewLink} view in Yahoo Mail`;

    const step2 = c('Import instructions step')
        .t`Mouse over the calendar you want to import and open the dropdown menu`;

    // translator: full sentence: "Select Export to export the calendar as an ICS file"
    const boldExport = <strong key="boldExport">{c('Import instructions emphasis').t`Export`}</strong>;
    // translator: full sentence: "Select Export to export the calendar as an ICS file"
    const step3 = c('Import instructions step').jt`Select ${boldExport} to export the calendar as an ICS file`;

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
export default YahooCalendarInstructions;
