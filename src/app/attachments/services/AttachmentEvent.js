import ICAL from 'ical.js';

/* @ngInject */
function AttachmentEvent() {
    /**
     * Get ical event from raw string of the event
     * @param {string} event info
     * @return {object}
     */
    const getIcalEvent = (info) => {
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

        icalEvent.attachment = info; // Keep the attachment

        return icalEvent;
    };

    return { getIcalEvent };
}
export default AttachmentEvent;
