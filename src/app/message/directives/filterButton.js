angular.module('proton.message')
.directive('filterButton', (filterModal) => {
    const recipients = ({ ToList = [], CCList = [], BCCList = [] }) => {
        return _.chain([].concat(ToList, CCList, BCCList))
            .map(({ Address }) => Address)
            .uniq()
            .value();
    };

    const attachments = ({ Attachments = [] }) => (Attachments.length ? 'contains' : '!contains');

    return {
        restrict: 'E',
        replace: true,
        scope: { message: '=' },
        templateUrl: 'templates/message/filterButton.tpl.html',
        link(scope, el) {
            scope.model = {};
            const $btn = el[0].querySelector('.filterButton-btn-next');

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
                        conditions.push({ Type: { value: 'subject' }, Comparator: { value: 'contains' }, Values: [scope.message.Subject] });
                    }

                    if (scope.model.sender) {
                        conditions.push({ Type: { value: 'sender' }, Comparator: { value: 'contains' }, Values: [scope.message.Sender.Address] });
                    }

                    if (scope.model.recipient) {
                        conditions.push({ Type: { value: 'recipient' }, Comparator: { value: 'contains' }, Values: recipients(scope.message) });
                    }

                    if (scope.model.attachments) {
                        conditions.push({ Type: { value: 'attachments' }, Comparator: { value: attachments(scope.message) } });
                    }

                    const filter = {
                        Simple: {
                            Operator: { value: 'all' },
                            Actions: [],
                            Conditions: conditions
                        }
                    };

                    filterModal.activate({
                        params: {
                            mode: 'simple',
                            filter,
                            close() { filterModal.deactivate(); }
                        }
                    });

                    initialize();
                    // Close the dropdown
                    el.click();
                });
            };


            $btn.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                $btn.removeEventListener('click', onClick);
            });
        }
    };
});
