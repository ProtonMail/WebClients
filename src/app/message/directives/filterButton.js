import { flow, map, uniq } from 'lodash/fp';

/* @ngInject */
function filterButton(dispatchers, filterModal, lazyLoader) {
    const recipients = ({ ToList = [], CCList = [], BCCList = [] }) => {
        return flow(
            map(({ Address }) => Address),
            uniq
        )(ToList.concat(CCList, BCCList));
    };

    const attachments = ({ Attachments = [] }) => (Attachments.length ? 'contains' : '!contains');

    return {
        restrict: 'E',
        replace: true,
        scope: { message: '=' },
        templateUrl: require('../../../templates/message/filterButton.tpl.html'),
        link(scope, el) {
            scope.model = {};
            const $btn = el[0].querySelector('.filterButton-btn-next');
            const { dispatcher } = dispatchers(['closeDropdown']);

            function initialize() {
                scope.model.subject = false;
                scope.model.sender = false;
                scope.model.recipient = false;
                scope.model.attachments = false;
            }

            initialize();

            const onClick = () => {
                scope.$applyAsync(() => {
                    const conditions = [];

                    if (scope.model.subject) {
                        conditions.push({
                            Type: { value: 'subject' },
                            Comparator: { value: 'contains' },
                            Values: [],
                            value: scope.message.Subject // Let the user change the value #7427
                        });
                    }

                    if (scope.model.sender) {
                        conditions.push({
                            Type: { value: 'sender' },
                            Comparator: { value: 'contains' },
                            Values: [scope.message.Sender.Address]
                        });
                    }

                    if (scope.model.recipient) {
                        conditions.push({
                            Type: { value: 'recipient' },
                            Comparator: { value: 'contains' },
                            Values: recipients(scope.message)
                        });
                    }

                    if (scope.model.attachments) {
                        conditions.push({
                            Type: { value: 'attachments' },
                            Comparator: { value: attachments(scope.message) }
                        });
                    }

                    const filter = {
                        Simple: {
                            Operator: { value: 'all' },
                            Actions: [],
                            Conditions: conditions
                        }
                    };

                    // We need to load CodeMirror to use filterModal
                    // https://github.com/ProtonMail/Angular/issues/6172
                    lazyLoader.extraVendor().then(() => {
                        filterModal.activate({
                            params: {
                                mode: 'simple',
                                filter,
                                close() {
                                    filterModal.deactivate();
                                }
                            }
                        });
                    });

                    initialize();
                    dispatcher.closeDropdown();
                });
            };

            $btn.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                $btn.removeEventListener('click', onClick);
            });
        }
    };
}
export default filterButton;
