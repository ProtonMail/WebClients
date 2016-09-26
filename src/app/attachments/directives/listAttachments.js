angular.module('proton.attachments')
    .directive('listAttachments', (attachmentModel, $state, $rootScope) => {

        const DECRYPTING_CLASSNAME = 'listAttachments-item-decrypt';
        const DOWNLOADED_CLASSNAME = 'listAttachments-item-download';
        const HIDDEN_CLASSNAME = 'hidden';

        return {
            scope: {
                model: '='
            },
            replace: true,
            templateUrl: 'templates/directives/attachments/listAttachments.tpl.html',
            link(scope, el) {

                const $list = el[0].querySelector('.listAttachments-list');
                const hide = () => !scope.model.Attachments.length && el[0].classList.add(HIDDEN_CLASSNAME);

                hide();


                // Bind custom className for outside
                $state.is('eo.reply') && el[0].classList.add('state-eoReply');

                const onClick = ({ target }) => {

                    // download attachment
                    if (target.nodeName === 'A') {

                        const ID = target.getAttribute('data-attachment-id');
                        const attachment = _.findWhere(scope.model.Attachments, { ID });

                        target.classList.add(DECRYPTING_CLASSNAME);

                        // Cf Safari
                        if (target.href && target.href.search(/^data.*/) !== -1) {
                            alert('Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.');
                            return false;
                        }

                        attachmentModel
                            .download(attachment, scope.model, target)
                            .then(() => {
                                target.classList.add(DOWNLOADED_CLASSNAME);
                            });
                    }

                    // Remove attachment
                    if (target.nodeName === 'BUTTON') {
                        const ID = target.getAttribute('data-attachment-id');
                        scope
                            .$applyAsync(() => {
                                const attachment = _.findWhere(scope.model.Attachments, { ID });

                                // If it's coming from outside there is no headers yet
                                // it's raw attachments without any record yet
                                if ((attachment.Headers || {}).embedded === 1) {
                                    scope.model.NumEmbedded--;
                                }
                                scope.model.Attachments = scope.model.Attachments.filter((att) => att.ID !== ID);
                                hide();
                            });
                    }
                };

                $list.addEventListener('click', onClick, false);

                scope
                    .$on('$destroy', () => {
                        $list.removeEventListener('click', onClick, false);
                    });
            }
        };
    });
