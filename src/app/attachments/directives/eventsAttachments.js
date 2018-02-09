import _ from 'lodash';

/* @ngInject */
function eventsAttachments(
    $state,
    $rootScope,
    pmcw,
    attachmentDownloader,
    notification,
    AppModel,
    AttachmentEvent,
    networkActivityTracker,
    downloadFile
) {
    const REGEXP_EVENT_EXTENSIONS = /\.(?:ics|icalendar|ical|vcard|vcf)$/i;
    const LOAD_CLASSNAME = 'eventsAttachments-load';
    const HIDDEN_CLASSNAME = 'eventsAttachments-hidden';

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/attachments/eventsAttachments.tpl.html'),
        link(scope, el) {
            scope.dateFormat = (start, end) => {
                if (!start || !end) {
                    return '';
                }

                if (end.diff(start, 'days') < 1) {
                    return `${start.format('ll')} ${start.format('LT')} – ${end.format('LT')}`;
                }

                return `${start.format('ll')} ${start.format('LT')} – ${end.format('ll')} ${end.format('LT')}`;
            };

            const onClick = (e) => {
                const { target } = e;

                if (target.nodeName === 'BUTTON') {
                    const uid = target.getAttribute('data-event-uid');
                    const event = scope.model.events.find((e) => e.uid === uid);

                    if (event) {
                        const { data } = event.attachment.data;

                        // Cf Safari
                        if (attachmentDownloader.isNotSupported(e)) {
                            return false;
                        }

                        // Download the file
                        downloadFile(new Blob([data.data], { type: data.filename }), data.filename);
                    }
                }
            };

            const events = scope.model.Attachments.filter(({ Name }) => REGEXP_EVENT_EXTENSIONS.test(Name));

            const mapAttachmentsToIcalEvent = (event) =>
                attachmentDownloader
                    .downloadString(event, scope.model)
                    .then(AttachmentEvent.getIcalEvent)
                    .catch((err) => AppModel.is('onLine') && notification.error(err));

            if (events.length) {
                el.removeClass(HIDDEN_CLASSNAME);

                // Initialize events for placeholders
                scope.model.events = Array.from({ length: events.length }, (_, i) => ({ uid: i }));

                el.addClass(LOAD_CLASSNAME);

                const promise = Promise.all(events.map(mapAttachmentsToIcalEvent)).then((events) => {
                    el.remove(LOAD_CLASSNAME);

                    scope.$applyAsync(() => {
                        scope.model.events = events
                            // Remove empty elements (eg. corrupted icals)
                            .filter(Boolean)
                            // Remove events with same UID (duplication)
                            .filter((ev, index, self) => self.findIndex((ev2) => ev2.uid === ev.uid) === index);

                        if (scope.model.events.length === 1) {
                            _.defer(() => {
                                // Open the first event panel
                                el[0].querySelector('.eventsAttachments-details').setAttribute('open', 'open');
                            });
                        }
                    });
                });

                networkActivityTracker.track(promise);
            }

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}

export default eventsAttachments;
