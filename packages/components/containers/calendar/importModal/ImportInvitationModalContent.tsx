import { c, msgid } from 'ttag';

import { AttachedFile } from '@proton/components';
import { ICAL_METHODS_ATTENDEE } from '@proton/shared/lib/calendar/constants';
import { extractTotals } from '@proton/shared/lib/calendar/import/import';
import { BRAND_NAME, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import type { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar/Import';

interface Props {
    model: ImportCalendarModel;
}

const ImportInvitationModalContent = ({ model }: Props) => {
    const { method, fileAttached } = model;
    const { totalToImport } = extractTotals(model);
    const isResponse = method && ICAL_METHODS_ATTENDEE.includes(method);

    return (
        <>
            <div>
                {isResponse
                    ? c('Import calendar; import invitation').ngettext(
                          msgid`This file contains an invitation response:`,
                          `This file contains invitation responses:`,
                          totalToImport
                      )
                    : c('Import calendar; import invitation').ngettext(
                          msgid`This file contains an event invitation:`,
                          `This file contains event invitations:`,
                          totalToImport
                      )}
            </div>
            {fileAttached && <AttachedFile file={fileAttached} iconName="calendar-grid" className="my-4" />}
            <div>
                {c('Import calendar; import invitation')
                    .t`Imported invitations appear in ${CALENDAR_APP_NAME} as simple events without organizer and participant details. To get event updates and see participants, ask organizers to invite you using your ${BRAND_NAME} email address.`}
            </div>
        </>
    );
};

export default ImportInvitationModalContent;
