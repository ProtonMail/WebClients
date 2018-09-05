import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function forgeRequestParameters($stateParams, $filter, mailSettingsModel) {
    function getWildCard() {
        if (angular.isDefined($stateParams.wildcard)) {
            return $stateParams.wildcard;
        }

        const { AutoWildcardSearch } = mailSettingsModel.get();
        return AutoWildcardSearch;
    }

    /**
     * A single ' or " can create an infinite $digest cf #7042
     * @return {String}
     */
    const getKeyBoard = () => {
        if (/^['"]$/.test($stateParams.keyword)) {
            return '';
        }
        return $stateParams.keyword;
    };

    function forge(mailbox) {
        const params = {
            Page: (~~$stateParams.page || 1) - 1
        };

        if (angular.isDefined($stateParams.filter)) {
            params.Unread = +($stateParams.filter === 'unread'); // Convert Boolean to Integer
        }

        if (angular.isDefined($stateParams.sort)) {
            let sort = $stateParams.sort;
            const desc = sort.charAt(0) === '-';

            if (desc === true) {
                sort = sort.slice(1);
            }

            params.Sort = $filter('capitalize')(sort);
            params.Desc = +desc;
        }

        if (mailbox === 'search') {
            params.AddressID = $stateParams.address;
            params.LabelID = $stateParams.label;
            params.Keyword = getKeyBoard();
            params.Recipients = $stateParams.to;
            params.From = $stateParams.from;
            params.Subject = $stateParams.subject;
            params.Begin = $stateParams.begin;
            params.End = $stateParams.end;
            params.Attachments = $stateParams.attachments;
            params.AutoWildcard = getWildCard();
            return params;
        }

        if (mailbox === 'label') {
            params.LabelID = $stateParams.label;
            return params;
        }

        params.LabelID = MAILBOX_IDENTIFIERS[mailbox];
        return params;
    }

    return forge;
}
export default forgeRequestParameters;
