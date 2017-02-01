angular.module('proton.utils')
    .factory('openStatePostMessage', ($state) => {

        function open(dest = '', opt, { message = {}, data }) {
            const tab = $state.href(dest, opt, { absolute: true });
            const [ protocol = 'http',, domain = '' ] = window.location.href.split('/');
            const targetOrigin = `${protocol}//${domain}`;
            function callback(event) {
                if (event.data === message.ID) {
                    event.source.postMessage(data || message, targetOrigin);
                    window.removeEventListener('message', callback, false);
                }
            }
            window.addEventListener('message', callback, false);
            window.open(tab, '_blank');
        }

        return { open };
    });
