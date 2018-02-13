import ICAL from 'ical.js';

/* @ngInject */
function AttachmentEvent(
    attachmentDownloader,
    notification,
    AppModel
) {
    const REGEXP_EVENT_EXTENSIONS = /\.(?:ics|icalendar|ical|vcard|vcf)$/i;

    const filterAttachmentsForEvents = (attachments = []) =>
        attachments.filter(({ Name }) => REGEXP_EVENT_EXTENSIONS.test(Name));

    const mapAttachmentsToIcalEvent = (event, model) => {
        return attachmentDownloader
            .downloadString(event, model)
            .then(getIcalEvent)
            .catch((err) => AppModel.is('onLine') && notification.error(err));
    };

    const load = (events, model) => {
        console.log(events, model);
        return Promise.all(events.map((event) => mapAttachmentsToIcalEvent(event, model)));
    };

    const dateFormat = ({ startDateMoment: start, endDateMoment: end, startDate }, withTimezone = false) => {
        if (!moment.isMoment(start) || !moment.isMoment(end)) {
            return '';
        }

        const timezone = (withTimezone && startDate.timezone) ? `(${startDate.timezone})` : '';

        if (end.diff(start, 'days') < 1) {
            return `${start.format('ll')} ${start.format('LT')} – ${end.format('LT')} ${timezone}`;
        }

        return `${start.format('ll')} ${start.format('LT')} – ${end.format('ll')} ${end.format('LT')} ${timezone}`;
    };

    /**
     * Get ical event from raw string of the event
     * @param {string} event info
     * @return {object}
     */
    function getIcalEvent(info) {
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

        icalEvent.attachment = event; // Keep the attachment

        return icalEvent;
    };

    return {
        dateFormat,
        getIcalEvent,
        filterAttachmentsForEvents,
        mapAttachmentsToIcalEvent,
        load
    };
}
export default AttachmentEvent;
