/* @ngInject */
function AttachmentEvent(attachmentDownloader, gettextCatalog) {
    const I18N = {
        ICS_PARSING_ERROR: gettextCatalog.getString('ICS parsing error:', null, 'Error')
    };
    const REGEXP_EVENT_EXTENSIONS = /\.(?:ics|icalendar|ical|vcard|vcf)$/i;

    const filterAttachmentsForEvents = (attachments = []) =>
        attachments.filter(({ Name }) => REGEXP_EVENT_EXTENSIONS.test(Name));

    const mapAttachmentsToIcalEvent = (event, model) => {
        return attachmentDownloader
            .downloadString(event, model)
            .then(getIcalEvent(event))
            .catch((error) => {
                console.error(error); // We display the error in the console to not polluate the UX
                return false; // If it fails we just remove invalid events on the UI
            });
    };

    const load = (events, model) => {
        return Promise.all(events.map((event) => mapAttachmentsToIcalEvent(event, model)));
    };

    const dateFormat = ({ startDateMoment: start, endDateMoment: end, startDate }, withTimezone = false) => {
        if (!moment.isMoment(start) || !moment.isMoment(end)) {
            return '';
        }

        const timezone = withTimezone && startDate.timezone ? `(${startDate.timezone})` : '';

        if (end.diff(start, 'days') < 1) {
            return `${start.format('ll')} ${start.format('LT')} – ${end.format('LT')} ${timezone}`;
        }

        return `${start.format('ll')} ${start.format('LT')} – ${end.format('ll')} ${end.format('LT')} ${timezone}`;
    };

    /**
     * Get ical event from raw string of the event
     * @param {object} event
     * @return {object}
     */
    function getIcalEvent({ Name }) {
        return (info) => {
            try {
                const jcalData = ICAL.parse(info);
                const vcalendar = new ICAL.Component(jcalData);
                const vevent = vcalendar.getFirstSubcomponent('vevent');
                const icalEvent = new ICAL.Event(vevent);

                // Invalid event
                if (!vevent) {
                    return false;
                }

                const { attendees = [] } = icalEvent;

                if (icalEvent.startDate && icalEvent.endDate) {
                    icalEvent.startDateMoment = moment(icalEvent.startDate.toJSDate());
                    icalEvent.endDateMoment = moment(icalEvent.endDate.toJSDate());
                }

                if (attendees.length) {
                    icalEvent.attendeesList = attendees.reduce((acc, attendee) => acc.concat(attendee.getValues()), []);
                }

                if (!icalEvent.summary && icalEvent.location) {
                    icalEvent.summary = icalEvent.location;
                }

                // Keep the attachment data and filename
                icalEvent.attachment = {
                    filename: Name,
                    data: info
                };

                return icalEvent;
            } catch (error) {
                throw new Error(`${I18N.ICS_PARSING_ERROR} ${error.message}`);
            }
        };
    }

    return {
        dateFormat,
        filterAttachmentsForEvents,
        load
    };
}
export default AttachmentEvent;
