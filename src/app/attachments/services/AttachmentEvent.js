import ICAL from 'ical.js';

/* @ngInject */
function AttachmentEvent($cacheFactory, $log, $q, pmcw, authentication, $state, $stateParams, Eo, secureSessionStorage, attachmentApi) {
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

        if (icalEvent.startDate && icalEvent.endDate) {
            icalEvent.startDateMoment = moment.unix(icalEvent.startDate.toUnixTime());
            icalEvent.endDateMoment = moment.unix(icalEvent.endDate.toUnixTime());
        }

        icalEvent.attachment = event; // Keep the attachment

        return icalEvent;
    };

    return { getIcalEvent };
}
export default AttachmentEvent;
