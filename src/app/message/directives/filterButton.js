angular.module('proton.message')
.directive('filterButton', (filterModal) => ({
    restrict: 'E',
    replace: true,
    scope: { message: '=' },
    template: `
    <span class="pm_buttons">
        <a href="#" class="pm_trigger open-label" pt-tooltip-translate="Custom Filter" pt-tooltip-translate-context="Action" pt-tooltip-translate-comment="Tooltip"  dropdown>
            <small><i class="fa fa-filter"></i> <i class="fa fa-angle-down"></i></small>
        </a>
        <span class="pm_dropdown wide">
            <ul class="filterButton-container">
                <li><b>Filter on:</b></li>
                <li class="filterButton-item"><label class="filterButton-label"><span class="filterButton-label-text">Subject</span> <custom-checkbox class="filterButton-checkbox" data-custom-ng-model="model.subject"></custom-checkbox></label></li>
                <li class="filterButton-item"><label class="filterButton-label"><span class="filterButton-label-text">Sender</span> <custom-checkbox class="filterButton-checkbox" ng-model="model.sender"></custom-checkbox></label></li>
                <li class="filterButton-item"><label class="filterButton-label"><span class="filterButton-label-text">Recipient</span> <custom-checkbox class="filterButton-checkbox"  ng-model="model.recipient"></custom-checkbox></label></li>
                <li class="filterButton-item"><label class="filterButton-label"><span class="filterButton-label-text">Attachments</span> <custom-checkbox class="filterButton-checkbox" ng-model="model.attachments"></custom-checkbox></label></li>
            </ul>
            <div>
                <p></p>
                <button class="pm_button primary" ng-click="next()">Next</button>
            </div>
        </span>
    </span>
    `,
    link(scope, element) {
        scope.model = {};

        function recipients({ ToList = [], CCList = [], BCCList = [] }) {
            return [].concat(ToList).concat(CCList).concat(BCCList).map((contact) => contact.Address);
        }

        function attachments({ Attachments = [] }) {
            return (Attachments.length) ? 'contains' : '!contains';
        }

        function initialize() {
            scope.model.subject = false;
            scope.model.sender = false;
            scope.model.recipient = false;
            scope.model.attachments = false;
        }

        scope.next = () => {
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
            element.click();
        };

        initialize();
    }
}));
