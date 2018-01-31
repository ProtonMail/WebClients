import _ from 'lodash';

const CLASSNAME = {
    UNDISCLOSED: 'message-undisclosed'
};

/* @ngInject */
function message($state, $rootScope, cache, displayContent, messageScroll, tools, unsubscribeModel, $exceptionHandler) {

    const getRecipients = ({ ToList = [], CCList = [], BCCList = [] } = {}) => ToList.concat(CCList, BCCList);

    /**
     * Back to element list
     */
    function back() {
        const route = $state.$current.name.replace('.element', '');
        $state.go(route, { id: null });
    }

    /**
     * Check if the message can be open for the current context
     * @param  {Array}  [LabelIDs=[]}]
     * @return {Boolean}
     */
    function canBeOpen({ LabelIDs = [] }) {
        const currentLocation = tools.currentLocation();
        const condition = LabelIDs.indexOf(currentLocation) !== -1;
        const type = tools.typeView();
        const isSearch = $state.includes('secured.search.**');
        return type === 'conversation' || isSearch || condition;
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/message/message.tpl.html'),
        scope: {
            message: '=model',
            marked: '=',
            last: '=',
            index: '='
        },
        link(scope, element) {
            const unsubscribe = [];

            const recipients = getRecipients(scope.message);
            !recipients.length && element[0].classList.add(CLASSNAME.UNDISCLOSED);

            const loadMessageBody = () => {
                return cache.getMessage(scope.message.ID).then((message) => _.extend(scope.message, message));
            };

            const updateMessage = (promise) => {
                promise
                    .then(({ type, body }) => {
                        scope.$applyAsync(() => {
                            scope.message.expand = true;
                            scope.message.isPlain = type === 'plain';
                            if (type && body) {
                                scope.message.viewMode = 'html';
                                scope.body = body;
                            }
                        });
                    })
                    .catch((e) => {
                        console.error(e);
                        $exceptionHandler(e);
                        scope.$applyAsync(() => {
                            scope.message.expand = true;
                            scope.message.viewMode = 'plain';
                        });
                    });
            };

            const loadContent = () => updateMessage(displayContent(scope.message, scope.body, scope.index));

            /**
             * Initialize the message
             */
            scope.body = ''; // Here we put the content displayed inside the message content
            scope.unsubscribed = unsubscribeModel.already(scope.message.getListUnsubscribe());
            (scope.message.openMe || scope.message.expand) && openMessage();

            unsubscribe.push(
                $rootScope.$on('message.open', (e, { type, data }) => {
                    if (data.message.ID !== scope.message.ID) {
                        return;
                    }

                    switch (type) {
                        case 'toggle':
                            openMessage(data);

                            // Coming from hotkeys or toggle
                            if (data.action) {
                                return messageScroll.to({
                                    index: scope.index,
                                    message: scope.message,
                                    node: element[0]
                                });
                            }

                            break;

                        case 'embedded.injected':
                            if (!data.action) {
                                scope.$applyAsync(() => (scope.body = data.body));
                            }
                            break;

                        case 'save.success':
                            if ($state.includes('secured.drafts.**')) {
                                return $state.go('secured.drafts');
                            }

                            openMessage();
                            break;
                    }
                })
            );

            unsubscribe.push(
                $rootScope.$on('message', (event, { type = '', data = {} }) => {
                    if (type === 'unsubscribed' && data.message.ID === scope.message.ID) {
                        scope.$applyAsync(() => {
                            scope.unsubscribed = unsubscribeModel.already(scope.message.getListUnsubscribe());
                        });
                    }
                })
            );

            unsubscribe.push(
                $rootScope.$on('message.refresh', (event, messageIDs) => {
                    if (messageIDs.indexOf(scope.message.ID) > -1) {
                        const message = cache.getMessageCached(scope.message.ID);
                        const type = tools.typeView();

                        if (message && canBeOpen(message)) {
                            scope.message = _.extend(scope.message, message);
                        } else if (type === 'message') {
                            back();
                        }
                    }
                })
            );

            function openMessage({ expand } = {}) {
                if (scope.message.Type === 1) {
                    if ($state.includes('secured.drafts.**')) {
                        $rootScope.$emit('composer.load', scope.message);
                    }
                    return;
                }

                // Default there is no expand, this key is coming from toggleMessage
                if (expand === false) {
                    // Default are undefined, only bind the value if they were set.
                    _.has(scope.message, 'showEmbedded') && (scope.message.showEmbedded = false);
                    _.has(scope.message, 'showImages') && (scope.message.showImages = false);
                    return;
                }

                const promise = typeof scope.message.Body === 'undefined' ? loadMessageBody() : Promise.resolve();

                promise.then(loadContent).then(() => {
                    // Auto focus message list when we load the message, to allow keyboard srolling
                    scope.$applyAsync(() => {
                        // If you switch to another conversation the container might not exist
                        $(document.getElementById('pm_thread')).focus();
                    });
                });
            }

            /**
             * Used for dropdown-folders, return the current message model inside an array
             * @return {Array}
             */
            scope.getElements = () => [scope.message];


            /**
             * Get all recipients
             * @return {Array} recipients
             */
            scope.recipients = () => recipients;

            /**
             * Check if there is no recipients
             * @return {Boolean}
             */
            scope.noRecipients = () => !recipients.length;

            // TODO need review with label dropdown
            scope.getMessage = () => [scope.message];

            /**
             * Method call when the user submit some labels to apply to this message
             * @param {Array} labels
             * @param {Boolean} alsoArchive
             */
            scope.saveLabels = (labels, alsoArchive) => {
                const messages = [scope.message];
                $rootScope.$emit('messageActions', { action: 'label', data: { messages, labels, alsoArchive } });
            };

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default message;
