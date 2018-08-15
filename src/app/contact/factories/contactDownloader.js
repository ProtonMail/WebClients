import { CANCEL_REQUEST, EXPORT_CONTACTS_LIMIT } from '../../constants';
import { createCancellationToken } from '../../../helpers/promiseHelper';

/* @ngInject */
function contactDownloader(Contact, contactLoaderModal, contactDetailsModel, downloadFile, vcard) {
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

    const get = async (id, cancellationToken) => {
        if (id !== 'all') {
            const { vCard } = await Contact.get(id, cancellationToken.getCancelEvent());
            return [vCard];
        }
        const list = await Contact.exportAll(EXPORT_CONTACTS_LIMIT, cancellationToken);
        return list.map(({ vCard }) => vCard);
    };

    return async (id = 'all') => {
        const cancellationToken = createCancellationToken();
        const close = () => {
            cancellationToken.cancel(CANCEL_REQUEST);
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
            const data = await get(id, cancellationToken);
            const blob = new Blob([vcard.to(data)], { type: 'data:attachment/vcard;' });
            contactLoaderModal.deactivate();
            downloadFile(blob, getFileName(id, data));
        } catch (e) {
            contactLoaderModal.deactivate();
        }
    };
}
export default contactDownloader;
