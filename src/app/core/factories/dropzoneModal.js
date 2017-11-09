angular.module('proton.core')
    .factory('dropzoneModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/dropzone.tpl.html',
            /* @ngInject */
            controller: function (params, notify, $timeout, $scope) {
                let files = [];
                let extension;
                const self = this;

                self.import = () => params.import(files);
                self.cancel = () => params.cancel();

                function initialization() {
                    const drop = document.getElementById('dropzone');

                    drop.ondrop = (e) => {
                        e.preventDefault();
                        extension = e.dataTransfer.files[0].name.substr(e.dataTransfer.files[0].name.length - 4);

                        if (extension !== '.csv' && extension !== '.vcf') {
                            notify('Invalid file type');
                            self.hover = false;
                        } else {
                            files = e.dataTransfer.files;
                            $scope.$applyAsync(() => {
                                self.fileDropped = files[0].name;
                                self.hover = false;
                            });
                        }
                    };

                    drop.ondragover = (event) => {
                        event.preventDefault();
                        self.hover = true;
                    };

                    drop.ondragleave = (event) => {
                        event.preventDefault();
                        self.hover = false;
                    };

                    $('#dropzone').on('click', () => {
                        $('#selectedFile').trigger('click');
                    });

                    $('#selectedFile').change(() => {
                        extension = $('#selectedFile')[0].files[0].name.substr($('#selectedFile')[0].files[0].name.length - 4);

                        if (extension !== '.csv' && extension !== '.vcf') {
                            notify('Invalid file type');
                        } else {
                            files = $('#selectedFile')[0].files;
                            $scope.$applyAsync(() => {
                                self.fileDropped = $('#selectedFile')[0].files[0].name;
                                self.hover = false;
                            });
                        }
                    });
                }

                $timeout(() => {
                    initialization();
                }, 100);
            }
        });
    });
