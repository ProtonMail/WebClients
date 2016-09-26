angular.module('proton.message')
.directive('messageView', ($stateParams, cache) => ({
    restrict: 'E',
    replace: true,
    template: `
    <div class="messageView-container">
        <header id="conversationHeader">
            <h1 ng-bind="message.Subject"></h1>
        </header>
        <div id="pm_thread">
            <message ng-if="message" data-model="message" data-last="true" data-index="0"></message>
        </div>
    </div>
    `,
    link(scope) {
        const messageID = $stateParams.id;

        cache.getMessage(messageID)
        .then((message) => {
            message.openMe = true;
            scope.message = message;
        });
    }
}));
