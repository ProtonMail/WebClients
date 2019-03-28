/* @ngInject */
const loginSubContainer = (authentication, $state) => {
    const url = window.location.href;
    const arr = url.split('/');
    const domain = arr[0] + '//' + arr[2];

    const handleMessage = (event) => {
        if (event.origin !== domain) {
            return;
        }

        const { data = {} } = event;
        const { UID, mailboxPassword } = data;

        if (!UID) {
            return;
        }

        window.removeEventListener('message', handleMessage);

        authentication.setPassword(mailboxPassword);
        authentication.setUID(UID);

        return $state.go('secured.inbox');
    };

    return {
        restrict: 'E',
        template: '<login-spinner></login-spinner>',
        link(scope) {
            window.addEventListener('message', handleMessage);
            window.opener.postMessage('ready', domain);

            scope.$on('$destroy', () => {
                window.removeEventListener('message', handleMessage);
            });
        }
    };
};

export default loginSubContainer;
