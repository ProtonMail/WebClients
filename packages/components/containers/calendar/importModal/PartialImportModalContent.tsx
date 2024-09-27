import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import AttachedFile from '@proton/components/components/attachedFile/AttachedFile';
import { IMPORT_CALENDAR_UNSUPPORTED_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { extractTotals } from '@proton/shared/lib/calendar/import/import';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar/Import';

import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportCalendarModel;
}

const PartialImportModalContent = ({ model }: Props) => {
    const { fileAttached, visibleErrors, failure } = model;
    const { totalToImport } = extractTotals(model);
    const totalEventsDiscarded = visibleErrors.filter(
        ({ componentIdentifiers: { component } }) => component === 'vevent'
    ).length;
    const totalEvents = totalToImport + totalEventsDiscarded;

    const learnMore = failure ? undefined : getKnowledgeBaseUrl(IMPORT_CALENDAR_UNSUPPORTED_FAQ_URL);
    const summary = (() => {
        if (totalEventsDiscarded === totalEvents) {
            return c('Import warning').t`No event can be imported. Expand for details.`;
        }
        if (totalEventsDiscarded === 0) {
            return c('Import warning').t`Part of your calendar content is not supported and will not be imported.`;
        }
        return c('Import warning').ngettext(
            msgid`${totalEventsDiscarded} out of ${totalEvents} event will not be imported. Expand for details.`,
            `${totalEventsDiscarded} out of ${totalEvents} events will not be imported. Expand for details.`,
            totalEvents
        );
    })();

    return (
        <>
            <div>{c('Import calendar; import invitation').t`This file contains some data that we cannot import:`}</div>
            {fileAttached && <AttachedFile file={fileAttached} iconName="calendar-grid" className="my-4" />}
            <Alert className="mb-4" type="warning">
                {c('Import calendar warning')
                    .t`${CALENDAR_APP_NAME} currently does not support certain event types, details and formats.`}
                {learnMore && (
                    <div>
                        <Href href={learnMore}>{c('Link').t`Learn more`}</Href>
                    </div>
                )}
            </Alert>
            <ErrorDetails summary={summary} errors={visibleErrors} />
        </>
    );
};

export default PartialImportModalContent;
