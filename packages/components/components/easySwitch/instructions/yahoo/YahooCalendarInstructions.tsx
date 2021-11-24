import { c } from 'ttag';

import yahooCalendarScreenshot from '@proton/styles/assets/img/import/instructions/yahoo-calendar.png';

import { Href } from '../../../link';

const YahooCalendarInstructions = () => {
    const calendarLink = (
        <Href url="https://calendar.yahoo.com/" key="calendarLink">
            {c('Import instructions link').t`Yahoo Mail's calendar view`}
        </Href>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Visit calendar.yahoo.com to access Yahoo Mail's calendar view. From there click on the down arrow on the right side of the calendar you want to export, then select the Export option to download your ICS file. This is the file you will upload to Proton during the import."
    const yahooCalendarMessage = c('Import instructions')
        .jt`Visit ${calendarLink} to access Yahoo Mail's calendar view. From there click on the down arrow on the right side of the calendar you want to export, then select the Export option to download your ICS file. This is the file you will upload to Proton during the import.`;

    return (
        <>
            <div className="mb1">{yahooCalendarMessage}</div>
            <div className="text-center">
                <img
                    className="border--currentColor"
                    src={yahooCalendarScreenshot}
                    alt={c('Import instructions image alternative text')
                        .t`Instructions to export your calendars from Yahoo Mail`}
                />
            </div>
        </>
    );
};
export default YahooCalendarInstructions;
