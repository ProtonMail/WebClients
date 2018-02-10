import _ from 'lodash';

/* @ngInject */
function contactLoaderModal($rootScope, gettextCatalog, pmModal) {
    const LABEL_CLASS = 'contactLoaderModal-label';
    const SUCCESS_CLASS = 'contactLoaderModal-success';
    const CONTAINER_CLASS = 'contactLoaderModal-container';
    const IMPORTED_CLASS = 'contactLoaderModal-imported';

    const I18N = {
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
            return gettextCatalog.getString('Upload: {{progress}}%', { progress }, 'Label for the progress bar displayed during the contact import');
        },
        mergeFail(number) {
            return gettextCatalog.getString('{{number}} failed to merge.', { number }, 'Number of failed contact during merge');
        },
        importFail(number) {
            return gettextCatalog.getString('{{number}} failed to import.', { number }, 'Number of failed contact during the contact import');
        },
        totalFailure: gettextCatalog.getString('Import failed. Please check the import file or try again.', null, 'Error during importation')
    };

    I18N.modal = {
        import: {
            title: gettextCatalog.getString('Importing Contacts', null, 'Title for the contacts exporter modal'),
            info: gettextCatalog.getString('Importing contacts, this may take a few minutes.', null, 'Information for the contacts importer modal'),
            progress: (progress) => (progress > 50 ? I18N.upload(progress) : I18N.encrypting(progress)),
            complete: gettextCatalog.getString('Importing contacts complete!', null, 'Import complete'),
            text: gettextCatalog.getString('contacts successfully imported.', null, '1 of 2 contacts successfully imported.')
        },
        export: {
            title: gettextCatalog.getString('Exporting Contacts', null, 'Title for the contacts exporter modal'),
            info: gettextCatalog.getString('Exporting contacts, this may take a few minutes. When the progress is completed, this modal will close and let you download the file.', null, 'Information for the contacts exporter modal'),
            progress: (progress) => I18N.decrypting(progress)
        },
        merge: {
            title: gettextCatalog.getString('Merging contacts', null, 'Title for the contacts merging modal'),
            info: gettextCatalog.getString('Merging contacts, this may take a few minutes.', null, 'Information for the contacts merging modal'),
            progress: (progress) => I18N.upload(progress),
            complete: gettextCatalog.getString('Merging contacts complete', null, 'Merge complete'),
            text: gettextCatalog.getString('contacts successfully merged.', null, '1 of 2 contacts successfully merged.')
        }
    };

    const getModalI18n = (key = '', type = '') => I18N.modal[key][type];

    const getRows = (errors = []) => errors.map(({ error }) => `<li class="contactLoaderModal-log">- ${error}</li>`).join('');
    const getError = (errors = [], total) => {
        if (!errors.length) {
            return '';
        }

        if (errors.length === total) {
            const [{ error = I18N.totalFailure } = {}] = errors;
            return `<p class="alert alert-danger">${error}</p>`;
        }

        return `
            <p>${I18N.importFail(errors.length)}</p>
            <ul class="contactLoaderModal-logs">${getRows(errors)}</ul>
        `;
    };
    const getSuccess = ({ count = 0, total = 0, text = '', complete = '', error }) => {
        return `
                <p>${complete}</p>
                <div class="contactLoaderModal-frame">
                    <h1>${count} of ${total}</h1>
                    <strong>${text}</strong>
                </div>
                ${error}
            `;
    };

    const getMergeRows = (errors = []) => errors.map((error) => `<li class="contactLoaderModal-log">- ${error}</li>`).join('');
    const getMergeError = (errors = []) => {
        if (!errors.length) {
            return '';
        }
        return `
            <p>${I18N.mergeFail(errors.length)}</p>
            <ul class="contactLoaderModal-logs">${getMergeRows(errors)}</ul>
        `;
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactLoaderModal.tpl.html'),
        /* @ngInject */
        controller: function (params) {
            const unsubscribe = [];

            unsubscribe.push(
                $rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                    if (type === 'contactCreated') {
                        const { created = [], errors = [], total = 0 } = data;
                        document.querySelector(`.${CONTAINER_CLASS}`).classList.add(IMPORTED_CLASS);
                        document.querySelector(`.${SUCCESS_CLASS}`).innerHTML = getSuccess({
                            count: created.length,
                            total,
                            complete: getModalI18n(params.mode, 'complete'),
                            text: getModalI18n(params.mode, 'text'),
                            error: getError(errors, total)
                        });
                    }
                    if (type === 'contactsMerged') {
                        const { updated = [], removed = [], errors = [], total = 0 } = data;
                        document.querySelector(`.${CONTAINER_CLASS}`).classList.add(IMPORTED_CLASS);
                        document.querySelector(`.${SUCCESS_CLASS}`).innerHTML = getSuccess({
                            count: updated.length + removed.length,
                            total,
                            complete: getModalI18n(params.mode, 'complete'),
                            text: getModalI18n(params.mode, 'text'),
                            error: getMergeError(errors, total)
                        });
                    }
                })
            );

            unsubscribe.push(
                $rootScope.$on('progressBar', (event, { type = '', data = {} }) => {
                    const $label = document.querySelector(`.${LABEL_CLASS}`);

                    if ($label && type === 'contactsProgressBar') {
                        $label.textContent = getModalI18n(params.mode, 'progress')(data.progress);
                    }
                })
            );

            this.title = getModalI18n(params.mode, 'title');
            this.info = getModalI18n(params.mode, 'info');
            this.close = params.close;
            this.$onDestroy = () => {
                _.each(unsubscribe, (cb) => cb());
                unsubscribe.length = 0;
            };
        }
    });
}

export default contactLoaderModal;
