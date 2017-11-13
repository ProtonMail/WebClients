angular.module('proton.contact')
    .factory('contactImporter', ($rootScope, contactSchema, dropzoneModal, notification, vcard, csv, gettextCatalog) => {
        const I18N = {
            noFiles: gettextCatalog.getString('No files were selected', null, 'Error'),
            invalid: gettextCatalog.getString('Invalid file type', null, 'Error')
        };
        const importVCF = (reader) => {
            const vcardData = reader.result;
            const parsed = vcard.from(vcardData);

            $rootScope.$emit('contacts', { type: 'createContact', data: { contacts: contactSchema.prepare(parsed), mode: 'import' } });
            dropzoneModal.deactivate();
        };
        const importVCard = (file) => {
            csv.csvToVCard(file)
                .then((parsed = []) => {
                    if (parsed.length) {
                        $rootScope.$emit('contacts', { type: 'createContact', data: { contacts: contactSchema.prepare(parsed), mode: 'import' } });
                    }

                    dropzoneModal.deactivate();
                })
                .catch((error) => console.error(error));
        };
        const importFiles = (files = []) => {
            if (!files.length) {
                notification.error(I18N.noFiles);
                return;
            }

            const reader = new FileReader();
            const file = files[0];
            const extension = file.name.slice(-4);

            reader.onload = () => {
                if (extension === '.vcf') {
                    importVCF(reader);
                } else if (extension === '.csv') {
                    importVCard(file);
                } else {
                    notification.error(I18N.invalid);
                    dropzoneModal.deactivate();
                }
            };

            reader.readAsText(file, 'utf-8');
        };

        return () => {
            dropzoneModal.activate({
                params: {
                    import: importFiles,
                    cancel() {
                        dropzoneModal.deactivate();
                    }
                }
            });
        };
    });
