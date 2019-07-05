import { csvToVCard } from '../../../helpers/csv';

/* @ngInject */
function contactImporter(
    contactSchema,
    dispatchers,
    importContactModal,
    notification,
    vcard,
    gettextCatalog,
    translator,
    networkActivityTracker
) {
    const I18N = translator(() => ({
        noFiles: gettextCatalog.getString('No files were selected', null, 'Error'),
        invalid: gettextCatalog.getString('Invalid file type', null, 'Error'),
        parsingCSV: gettextCatalog.getString('Cannot convert the file', null, 'Error')
    }));

    const { dispatcher } = dispatchers(['contacts']);
    const dispatch = (data = []) => {
        dispatcher.contacts('createContact', {
            contacts: contactSchema.prepareContacts(data),
            mode: 'import'
        });
    };

    const importVCF = async (reader) => dispatch(vcard.from(reader));
    const importVCard = (file) => {
        return csvToVCard(file)
            .then((parsed = []) => parsed.length && dispatch(parsed))
            .catch((e) => {
                console.error(e);
                throw new Error(I18N.parsingCSV);
            });
    };

    const MAP_SRC = {
        '.vcf': importVCF,
        '.csv': importVCard
    };

    /**
     * Read the file and detect its encoding to have correct chars inside the output
     * Some people work with Outlook, so as it's Windows the encoding is a bit ramdom.
     * If we don't have something UTF-8 let's read it again with the file's encoding.
     * @param  {File} file
     * @param  {String} charset
     * @param  {Boolean} options.ignoreFallback True if we re-read the file to prevent infinite loop
     * @param  {Function} options.resolver       Resolve promise
     * @param  {Function} options.rejection}    Reject promise
     * @return {Promise:<result>}
     */
    function readFile(file, charset = 'utf-8', { ignoreFallback, resolver, rejection } = {}) {
        const reader = new FileReader();
        const extension = file.name.toLowerCase().slice(-4);

        if (!MAP_SRC[extension]) {
            notification.error(I18N.invalid);
            return importContactModal.deactivate();
        }

        if (extension !== '.vcf') {
            return file.result;
        }

        const action = (resolve, reject) => {
            reader.onload = reject;
            reader.onload = () => {
                const [, charsetCustom = ''] = reader.result.match(/CHARSET=(.+):/) || [];
                if (!ignoreFallback && !/utf-8/i.test(charsetCustom)) {
                    return readFile(file, charsetCustom, {
                        ignoreFallback: true,
                        resolver: resolve,
                        rejection: reject
                    });
                }

                return resolve(reader.result);
            };

            reader.readAsText(file, charset);
        };

        if (ignoreFallback) {
            return action(resolver, rejection);
        }
        return new Promise(action);
    }

    const importFiles = async (files = []) => {
        if (!files.length) {
            return notification.error(I18N.noFiles);
        }
        const file = files[0];
        const extension = file.name.toLowerCase().slice(-4);

        try {
            const output = await readFile(file);
            const parameter = extension === '.vcf' ? output : file;
            const promise = MAP_SRC[extension](parameter).then(() => importContactModal.deactivate());
            networkActivityTracker.track(promise);
        } catch (e) {
            notification.error(e);
        }
    };

    return () => {
        importContactModal.activate({
            params: {
                import: importFiles,
                cancel() {
                    importContactModal.deactivate();
                }
            }
        });
    };
}
export default contactImporter;
