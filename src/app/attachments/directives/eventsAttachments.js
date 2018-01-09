const ICAL = require('ical.js');

/* @ngInject */
function eventsAttachments($state, $rootScope, attachmentDownloader, notification, AppModel) {
    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/attachments/eventsAttachments.tpl.html'),
        link(scope) {
            scope.model.events = [];
            const events = scope.model.Attachments.filter(({ Name }) => Name.match(/\.(?:ics|icalendar|ical|vcard|vcf)$/i));
            // scope.model.events = [];
            Promise.all(
                events.map((event) => {
                    return attachmentDownloader
                        .downloadString(event, scope.model)
                        .then((info) => {
                            const jcalData = ICAL.parse(info);
                            const vcalendar = new ICAL.Component(jcalData);
                            const vevent = vcalendar.getFirstSubcomponent('vevent');
                            const event = new ICAL.Event(vevent);
                            // const summary = event.summary;
                            // const summary = vevent.getFirstPropertyValue('summary');
                            // const description = vevent.getFirstPropertyValue('description');
                            // const attendee = vevent.getFirstPropertyValue('attendee');

                            // console.log(vcalendar);
                            // console.log('Summary: ' + summary);
                            // console.log('Description: ' + description);

                            // console.log(new ICAL.Event(event.attendees));

                            // if (event.attendee) {
                            //     event.attendee = event.attendee.jCal;
                            // }

                            // scope.model.events.push(event);

                            // scope.model.events.push(vevent.getAllProperties('attendee'));

                            // vevent.getAllProperties('attendee').forEach((attendee) => {
                            //     console.log(attendee);
                            //     // console.log(attendee.iterator());
                            // });

                            // console.log(vevent.getFirstSubcomponent('attendees'));
                            // console.log(vevent.getAllSubcomponents('attendees'));

                            // console.log(new ICAL.Component(event.attendees.jCal));

                            // console.log(getEventFromJcal(event.attendees));

                            // console.log(scope.model.events[0]);
                            // alert(`Summary: ${summary}\nDescription: ${description}`);

                            return event;
                        })
                        .catch((err) => {
                            AppModel.is('onLine') && notification.error(err);
                        });
                })
            ).then((events) => {
                scope.$applyAsync(() => {
                    console.log(events);
                    scope.model.events = events;
                });
            });
        }
    };
}
export default eventsAttachments;
