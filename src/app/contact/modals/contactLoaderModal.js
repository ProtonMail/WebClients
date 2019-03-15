/* @ngInject */
function contactLoaderModal(dispatchers, gettextCatalog, pmModal, translator) {

    const LABEL_CLASS = 'contactLoaderModal-label';

    const I18N = translator(() => ({
        encrypting(progress) {
            return gettextCatalog.getString(
                'Encrypting contacts: {{progress}}%',
                { progress },
                'Label for the progress bar displayed during the contact import'
            );
        },
        decrypting(progress) {
            return gettextCatalog.getString(
                'Decrypting contacts: {{progress}}%',
                { progress },
                'Label for the progress bar displayed during the contact export'
            );
        },
        upload(progress) {
            return gettextCatalog.getString(
                'Upload: {{progress}}%',
                { progress },
                'Label for the progress bar displayed during the contact import'
            );
        },
        mergeFail(number) {
            return gettextCatalog.getString(
                '{{number}} failed to merge.',
                { number },
                'Number of failed contact during merge'
            );
        },
        importFail(number) {
            return gettextCatalog.getString(
                '{{number}} failed to import.',
                { number },
                'Number of failed contact during the contact import'
            );
        },
        totalFailure: gettextCatalog.getString(
            'Import failed. Please check the import file or try again.',
            null,
            'Error during importation'
        ),
        cancelling: gettextCatalog.getString('Import cancelled. Rolling back.', null, 'Cancelled during importation')
    }));

    I18N.modal = translator(() => ({
        import: {
            title: gettextCatalog.getString('Importing Contacts', null, 'Title for the contacts exporter modal'),
            info: gettextCatalog.getString(
                'Importing contacts, this may take a few minutes.',
                null,
                'Information for the contacts importer modal'
            ),
            progress: (progress) => (progress > 50 ? I18N.upload(progress) : I18N.encrypting(progress)),
            complete: gettextCatalog.getString('Importing contacts complete!', null, 'Import complete'),
            text: gettextCatalog.getString(
                'contacts successfully imported.',
                null,
                '1 of 2 contacts successfully imported.'
            )
        },
        export: {
            title: gettextCatalog.getString('Exporting Contacts', null, 'Title for the contacts exporter modal'),
            info: gettextCatalog.getString(
                'Exporting contacts, this may take a few minutes. When the progress is completed, this modal will close and let you download the file.',
                null,
                'Information for the contacts exporter modal'
            ),
            progress: (progress) => I18N.decrypting(progress)
        },
        merge: {
            title: gettextCatalog.getString('Merging contacts', null, 'Title for the contacts merging modal'),
            info: gettextCatalog.getString(
                'Merging contacts, this may take a few minutes.',
                null,
                'Information for the contacts merging modal'
            ),
            progress: (progress) => I18N.upload(progress),
            complete: gettextCatalog.getString('Merging contacts complete', null, 'Merge complete'),
            text: gettextCatalog.getString(
                'contacts successfully merged.',
                null,
                '1 of 2 contacts successfully merged.'
            )
        }
    }));

    const getModalI18n = (key = '', type = '') => I18N.modal[key][type];

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactLoaderModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope, importContactGroups, networkActivityTracker) {
            const { on, unsubscribe } = dispatchers();
            let $label = document.querySelector(`.${LABEL_CLASS}`);

            this.class = 'small';
            this.title = getModalI18n(params.mode, 'title');
            this.info = getModalI18n(params.mode, 'info');
            this.optionsGroup = importContactGroups.getOptions();
            this.pendingImport = false;

            let importGroup = () => ({});

            /**
             * Preformat the model based on the defaut default categories available for the user
             * @return {Object}
             */
            const createCategoriesModel = () => {
                return this.categories.reduce((acc, { group }) => {
                    const index = +!!group.isNew;
                    acc[group.ID] = {
                        action: this.optionsGroup[index],
                        group: {
                            label: group.Name,
                            value: group.ID,
                            data: {}
                        },
                        name: group.isNew ? group.Name : ''
                    };
                    return acc;
                }, Object.create(null));
            };

            const setSuccess = (opt) => {
                this.success = {
                    complete: getModalI18n(params.mode, 'complete'),
                    text: getModalI18n(params.mode, 'text'),
                    ...opt
                };
            };

            const setErrors = (type = 'import', errors = [], total) => {
                if (!errors.length) {
                    return;
                }

                this.error = {
                    list: errors,
                    total
                };

                if (errors.length === total) {
                    const [{ error = I18N.totalFailure } = {}] = errors;
                    this.error.message = error;
                    return;
                }

                this.error.message = I18N[`${type}Fail`](errors.length);
            };

            const processResponse = (
                { created = [], errors = [], total = 0, categories = [], updated = [], removed = {} },
                type
            ) => {
                const count = type === 'merge' ? updated.length + removed.length : created.length;

                $scope.$applyAsync(() => {
                    this.state = 'imported';
                    setSuccess({ count, total });
                    setErrors(type, errors, total);
                    this.categories = categories;
                });
            };

            on('contacts', (e, { type = '', data = {} }) => {
                if (type === 'contactCreated') {
                    const { created, mapCategories } = data;
                    importGroup = importContactGroups(created, mapCategories);
                    processResponse({
                        ...data,
                        categories: importGroup.list()
                    });
                }

                if (type === 'contactsMerged') {
                    processResponse(data, 'merge');
                }
            });

            on('progressBar', (event, { type = '', data = {} }) => {
                !$label && ($label = document.querySelector(`.${LABEL_CLASS}`));
                if ($label && type === 'contactsProgressBar') {
                    $label.textContent = getModalI18n(params.mode, 'progress')(data.progress);
                }
            });

            this.save = () => {
                if ($scope.contactImport.$invalid) {
                    return;
                }
                this.pendingImport = true;
                networkActivityTracker
                    .track(importGroup.run(this.model))
                    .then(() => params.close())
                    .catch(() => {
                        this.pendingImport = false;
                    });
            };

            this.toStep = (step) => {
                this.state = step;
                this.class = '';
                this.model = createCategoriesModel();
            };

            this.close = () => {
                $label && ($label.textContent = I18N.cancelling);
                params.close();
            };

            this.$onDestroy = () => {
                unsubscribe();
            };
        }
    });
}

export default contactLoaderModal;
