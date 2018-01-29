import _ from 'lodash';

/* @ngInject */
function contactLoaderModal($rootScope, gettextCatalog, pmModal) {
    const LABEL_CLASS = 'contactLoaderModal-label';
    const SUCCESS_CLASS = 'contactLoaderModal-success';
    const ERROR_CLASS = 'contactLoaderModal-error';
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
        importComplete: gettextCatalog.getString('Importing contacts complete!', null, 'Import complete'),
        contactImported: gettextCatalog.getString('contacts successfully imported.', null, '1 of 2 contacts successfully imported.'),
        exportTitle: gettextCatalog.getString('Exporting Contacts', null, 'Title for the contacts exporter modal'),
        importTitle: gettextCatalog.getString('Importing Contacts', null, 'Title for the contacts exporter modal'),
        exportInfo: gettextCatalog.getString(
            'Exporting contacts, this may take a few minutes. When the progress is completed, this modal will close and let you download the file.',
            null,
            'Information for the contacts exporter modal'
        ),
        importInfo: gettextCatalog.getString('Importing contacts, this may take a few minutes.', null, 'Information for the contacts importer modal'),
        importFail(number) {
            return gettextCatalog.getString('{{number}} failed to import.', { number }, 'Number of failed contact during the contact import');
        },
        totalFailure: gettextCatalog.getString('Import failed. Please check the import file or try again.', null, 'Error during importation')
    };

    const getTitle = (mode) => (mode === 'export' ? I18N.exportTitle : I18N.importTitle);
    const getInfo = (mode) => (mode === 'export' ? I18N.exportInfo : I18N.importInfo);
    const getLabel = (mode = '', progress = 0) => {
        if (mode === 'export') {
            return I18N.decrypting(progress);
        }

        if (mode === 'import') {
            return progress > 50 ? I18N.upload(progress) : I18N.encrypting(progress);
        }

        return '';
    };

    const getRows = (errors = []) => errors.map(({ error }) => `<li class="contactLoaderModal-log">- ${error}</li>`).join('');
    const getSuccess = ({ created = [], total = 0 }) => {
        return `
                <p>${I18N.importComplete}</p>
                <div class="contactLoaderModal-frame">
                    <h1>${created.length} of ${total}</h1>
                    <strong>${I18N.contactImported}</strong>
                </div>
            `;
    };

    const getError = ({ errors = [], total }) => {
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

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactLoaderModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const unsubscribe = [];

            unsubscribe.push(
                $rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                    if (type === 'contactCreated') {
                        document.querySelector(`.${CONTAINER_CLASS}`).classList.add(IMPORTED_CLASS);
                        document.querySelector(`.${SUCCESS_CLASS}`).innerHTML = getSuccess(data);
                    }

                    if (type === 'contactErrors') {
                        document.querySelector(`.${CONTAINER_CLASS}`).classList.add(IMPORTED_CLASS);
                        document.querySelector(`.${ERROR_CLASS}`).innerHTML = getError(data);
                    }
                })
            );

            unsubscribe.push(
                $rootScope.$on('progressBar', (event, { type = '', data = {} }) => {
                    const $label = document.querySelector(`.${LABEL_CLASS}`);

                    if ($label && type === 'contactsProgressBar') {
                        $label.textContent = getLabel(params.mode, data.progress);
                    }
                })
            );

            this.title = getTitle(params.mode);
            this.info = getInfo(params.mode);
            this.close = params.close;
            this.$onDestroy = () => {
                _.each(unsubscribe, (cb) => cb());
                unsubscribe.length = 0;
            };
        }
    });
}
export default contactLoaderModal;
