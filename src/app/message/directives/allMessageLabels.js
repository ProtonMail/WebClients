angular.module('proton.message')
.directive('allMessageLabels', ($rootScope, CONSTANTS) => {

    function checkLabel({ LabelIDs = [] }, mailbox = '') {
        const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        return LabelIDs.indexOf(labelID) !== -1;
    }

    return {
        templateUrl: 'templates/message/allMessageLabels.tpl.html',
        replace: true,
        link(scope) {


            /**
             * Check if the current message is archived
             * @return {Boolean}
             */
            scope.isArchive = () => {
                return checkLabel(scope.message, 'archive');
            };


            /**
             * Check if the current message is in trash
             * @return {Boolean}
             */
            scope.isTrash = () => {
                return checkLabel(scope.message, 'trash');
            };

            /**
             * Check if the current message is in spam
             * @return {Boolean}
             */
            scope.isSpam = () => {
                return checkLabel(scope.message, 'spam');
            };
        }
    };
});
