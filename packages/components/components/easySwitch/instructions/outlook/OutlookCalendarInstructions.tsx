import { c } from 'ttag';

import { IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../../link';

const OutlookCalendarInstructions = () => {
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download it from Outlook in 3 easy steps:"
    const knowledgeBaseLink = (
        <Href url={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)} key="knowledgeBaseLink">
            {c('Import instructions link').t`ICS file`}
        </Href>
    );
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download it from Outlook in 3 easy steps:"
    const outlookCalendarMessage = c('Import instructions')
        .jt`To import a calendar to Proton, you need the ${knowledgeBaseLink}. Download it from Outlook in 3 easy steps:`;

    // translator: full sentence: "Go to shared calendars in your Outlook settings."
    const calendarLink = (
        <Href url="https://outlook.live.com/calendar/0/options/calendar/SharedCalendars/" key="calendarLink">
            {c('Import instructions link').t`shared calendars`}
        </Href>
    );
    // translator: full sentence: "Go to shared calendars in your Outlook settings."
    const step1 = c('Import instructions step').jt`Go to ${calendarLink} in your Outlook settings.`;

    // translator: full sentence: "Under Publish a calendar, select the calendar you want to import. Set the permission to Can view all details and publish it."
    const boldPublish = <strong key="boldPublish">{c('Import instructions emphasis').t`Publish a calendar`}</strong>;
    // translator: full sentence: "Under Publish a calendar, select the calendar you want to import. Set the permission to Can view all details and publish it."
    const boldCanViewAllDetails = (
        <strong key="boldCanViewAllDetails">{c('Import instructions emphasis').t`Can view all details`}</strong>
    );
    // translator: full sentence: "Under Publish a calendar, select the calendar you want to import. Set the permission to Can view all details and publish it."
    const step2 = c('Import instructions step')
        .jt`Under ${boldPublish}, select the calendar you want to import. Set the permission to ${boldCanViewAllDetails} and publish it.`;

    // translator: full sentence: "Click on the ICS link and download the file."
    const boldICS = <strong key="boldICS">{c('Import instructions emphasis').t`ICS`}</strong>;
    // translator: full sentence: "Click on the ICS link and download the file."
    const step3 = c('Import instructions step').jt`Click on the ${boldICS} link and download the file.`;

    return (
        <>
            <div className="mb1">{outlookCalendarMessage}</div>

            <ol className="pl1 ml2 mr2">
                <li className="mb0-5">{step1}</li>
                <li className="mb0-5">{step2}</li>
                <li className="mb0-5">{step3}</li>
            </ol>
        </>
    );
};

export default OutlookCalendarInstructions;
