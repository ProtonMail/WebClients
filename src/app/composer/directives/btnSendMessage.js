angular.module('proton.composer')
    .directive('btnSendMessage', ($rootScope, gettextCatalog) => {

        /**
         * Find the label depending on the status of the message
         * @param  {Object} msg Message
         * @return {String}     Translated label
         */
        const getLabel = (msg) => {
            let label;

            switch (!!msg) {
                case (msg.uploading > 0):
                    label = gettextCatalog.getString('Uploading', null, 'Action');
                    break;
                case (msg.encrypting === true):
                    label = gettextCatalog.getString('Encrypting', null, 'Action');
                    break;
                case (msg.saving === true && msg.autosaving === false):
                    label = gettextCatalog.getString('Saving', null, 'Action');
                    break;
                case (msg.sending === true):
                    label = gettextCatalog.getString('Sending', null, 'Action');
                    break;
                case (msg.disableSend && msg.disableSend()):
                    label = gettextCatalog.getString('Send', null, 'Action');
                    break;
                default:
                    label = gettextCatalog.getString('Send', null, 'Action');
                    break;
            }

            return label;
        };


        return {
            replace: true,
            scope: {
                model: '=message'
            },
            template: '<button class="btnSendMessage-btn-action"></button>',
            link(scope, el) {

                const isCurrentMsg = (msg) => msg.ID === scope.model.ID;

                el[0].textContent = getLabel(scope.model);

                const onClick = () => $rootScope.$emit('sendMessage', undefined, scope.model);

                const unsubscribe = $rootScope
                    .$on('actionMessage', (e, message) => {
                        if (isCurrentMsg(message)) {
                            el[0].textContent = getLabel(message);

                            if (message.disableSend) {
                                el[0].disabled = message.disableSend();
                            }
                        }
                    });

                el.on('click', onClick);

                scope
                    .$on('$destroy', () => {
                        el.off('click', onClick);
                        unsubscribe();
                    });
            }
        };
    });
