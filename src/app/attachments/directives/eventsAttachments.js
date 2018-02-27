import _ from 'lodash';

/* @ngInject */
function eventsAttachments(
    $state,
    $rootScope,
    pmcw,
    attachmentDownloader,
    AppModel,
    AttachmentEvent,
    networkActivityTracker,
    dispatchers,
    downloadFile
) {
    const LOAD_CLASSNAME = 'eventsAttachments-load';
    const HIDDEN_CLASSNAME = 'eventsAttachments-hidden';

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/attachments/eventsAttachments.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers(['message.open']);

            scope.dateFormat = AttachmentEvent.dateFormat;

            const loadEvents = (attachments = []) => {
                const events = AttachmentEvent.filterAttachmentsForEvents(attachments);

                if (!events.length) {
                    return;
                }

                el.removeClass(HIDDEN_CLASSNAME);

                // Initialize events for placeholders
                scope.model.events = events.map((_, uid) => ({ uid }));

                el.addClass(LOAD_CLASSNAME);

                const promise = AttachmentEvent.load(events, scope.model).then((events) => {
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
            };

            const onClick = (e) => {
                const { target } = e;

                if (target.nodeName === 'BUTTON') {
                    const uid = target.getAttribute('data-event-uid');
                    const event = scope.model.events.find((e) => e.uid === uid);

                    if (event) {
                        // Cf Safari
                        if (attachmentDownloader.isNotSupported(e)) {
                            return false;
                        }

                        const { filename, data = '' } = event.attachment;

                        // Download the file
                        downloadFile(new Blob([data], { type: filename }), filename);
                    }
                }
            };

            on('message.open', (e, { type = '', data = {} }) => {
                if (type === 'render') {
                    const { message = {} } = data;
                    loadEvents(message.Attachments);
                    unsubscribe();
                }
            });

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('click', onClick);
            });
        }
    };
}

export default eventsAttachments;
