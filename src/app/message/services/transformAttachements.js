import _ from 'lodash';

/* @ngInject */
function transformAttachements(embedded, $rootScope) {
    return (body, message, { action }) => {
        /**
         * Usefull when we inject the content into the message (load:manual)
         */
        action &&
            $rootScope.$emit('message.open', {
                type: 'embedded.injected',
                data: {
                    action: 'user.inject.load',
                    map: {},
                    message,
                    body: body.innerHTML
                }
            });

        embedded.parser(message, { direction: 'blob', text: body.innerHTML }).then(() => {
            /**
             * wait a little before loading it, if we have some cache it's faster than
             * the $digest.
             */
            _.defer(() => {
                $rootScope.$emit('message.embedded', {
                    type: 'loaded',
                    data: { message, body, action }
                });
            }, 32);
        });

        return body;
    };
}
export default transformAttachements;
