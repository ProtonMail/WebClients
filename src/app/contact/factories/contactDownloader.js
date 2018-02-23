import { CONSTANTS } from '../../constants';

/* @ngInject */
function contactDownloader(Contact, contactLoaderModal, contactDetailsModel, downloadFile, vcard, $q) {
    const { CANCEL_REQUEST, EXPORT_CONTACTS_LIMIT } = CONSTANTS;
    const getFileName = (id, [card]) => {
        let nameProperty = card.get('fn');

        if (Array.isArray(nameProperty)) {
            nameProperty = nameProperty[0];
        }

        if (id !== 'all' && nameProperty) {
            return `${contactDetailsModel.unescapeValue(nameProperty.valueOf())}.vcf`;
        }

        return 'proton.vcf';
    };

    const get = async (id, timeout) => {
        if (id !== 'all') {
            const { vCard } = await Contact.get(id, timeout);
            return [vCard];
        }
        const list = await Contact.exportAll(EXPORT_CONTACTS_LIMIT, timeout);
        return list.map(({ vCard }) => vCard);
    };

    return async (id = 'all') => {
        let deferred = $q.defer();
        const close = () => {
            if (deferred) {
                deferred.resolve(CANCEL_REQUEST);
                return _rAF(() => (deferred = null));
            }
            contactLoaderModal.deactivate();
        };

        contactLoaderModal.activate({
            params: {
                mode: 'export',
                onEscape: close,
                close
            }
        });

        try {
            const data = await get(id, deferred.promise);
            deferred = null;
            const blob = new Blob([vcard.to(data)], { type: 'data:attachment/vcard;' });
            contactLoaderModal.deactivate();
            downloadFile(blob, getFileName(id, data));
        } catch (e) {
            deferred = null;
            contactLoaderModal.deactivate();
        }
    };
}
export default contactDownloader;
