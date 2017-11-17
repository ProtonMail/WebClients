angular.module('proton.contact')
    .factory('importContactModal', (pmModal, notification, gettextCatalog) => {

        const I18N = {
            invalidType: gettextCatalog.getString('Invalid file type')
        };

        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/importContactModal.tpl.html',
            /* @ngInject */
            controller: function (params, notify, $timeout, $scope) {

                let files = [];
                let extension;

                this.import = () => params.import(files);
                this.cancel = params.cancel;

                const initialization = () => {
                    const drop = document.getElementById('dropzone');
                    const $selectFile = $('#selectedFile');

                    drop.ondrop = (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        extension = file.name.substr(file.name.length - 4);

                        if (extension !== '.csv' && extension !== '.vcf') {
                            this.hover = false;
                            return notification.error(I18N.invalidType);
                        }

                        files = e.dataTransfer.files;
                        $scope.$applyAsync(() => {
                            this.fileDropped = files[0].name;
                            this.hover = false;
                        });
                    };

                    drop.ondragover = (event) => {
                        event.preventDefault();
                        this.hover = true;
                    };

                    drop.ondragleave = (event) => {
                        event.preventDefault();
                        this.hover = false;
                    };

                    $('#dropzone').on('click', () => {
                        $selectFile.trigger('click');
                    });

                    $selectFile.change(() => {
                        const listFiles = $selectFile[0].files;
                        const file = listFiles[0].name;

                        extension = file.substr(file.length - 4);

                        if (extension !== '.csv' && extension !== '.vcf') {
                            return notification.error(I18N.invalidType);
                        }

                        files = listFiles;
                        $scope.$applyAsync(() => {
                            this.fileDropped = file;
                            this.hover = false;
                        });
                    });
                };

                _.defer(initialization, 100);
            }
        });
    });
