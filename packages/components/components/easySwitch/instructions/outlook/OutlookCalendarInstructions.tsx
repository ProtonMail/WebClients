import { c } from 'ttag';

import outlookCalendarScreenshot from '@proton/styles/assets/img/import/instructions/outlook-calendar.png';

import { Href } from '../../../link';

const OutlookCalendarInstructions = () => {
    const calendarLink = (
        <Href url="https://outlook.live.com/calendar/0/options/calendar/SharedCalendars/" key="calendarLink">
            {c('Import instructions link').t`Shared calendars settings`}
        </Href>
    );

    const boldPublish = <strong key="boldPublish">{c('Import instructions emphasis').t`Publish a calendar`}</strong>;

    const boldPermission = (
        <strong key="boldPermission">{c('Import instructions emphasis').t`Can view all details`}</strong>
    );

    // translator: the variable here are HTML tags, here is the complete sentence: "Visit Outlook Shared calendars settings. In the Publish a calendar section, choose the calendar you want to import and select Can view all details as the permission option. Finally, click on the Publish button. From there, you will be able to download your ICS file by clicking on the generated link then selecting the Download option. This is the file you will upload to Proton during the import."
    const outlookCalendarMessage = c('Import instructions')
        .jt`Visit Outlook ${calendarLink}. In the ${boldPublish} section, choose the calendar you want to import and select ${boldPermission} as the permission option. Finally, click on the Publish button. From there, you will be able to download your ICS file by clicking on the generated link then selecting the Download option. This is the file you will upload to Proton during the import.`;

    return (
        <>
            <div className="mb1">{outlookCalendarMessage}</div>
            <div className="text-center">
                <img
                    className="border--currentColor"
                    src={outlookCalendarScreenshot}
                    alt={c('Import instructions image alternative text')
                        .t`Instructions to export a calendar from Outlook.com`}
                />
            </div>
        </>
    );
};

export default OutlookCalendarInstructions;
