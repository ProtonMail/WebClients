/* @ngInject */
function contactDownloader(Contact, contactLoaderModal, contactDetailsModel, downloadFile, vcard) {
    const getFileName = (id, [card]) => {
        const nameProperty = card.get('fn');

        if (id !== 'all' && nameProperty) {
            return `${contactDetailsModel.unescapeValue(nameProperty.valueOf())}.vcf`;
        }

        return 'proton.vcf';
    };

    const get = async (id) => {
        if (id !== 'all') {
            const { vCard } = await Contact.get(id);
            return [vCard];
        }
        const list = await Contact.exportAll();
        return list.map(({ vCard }) => vCard);
    };

    return (id = 'all') => {
        const promise = get(id);

        contactLoaderModal.activate({
            params: {
                mode: 'export',
                close() {
                    contactLoaderModal.deactivate();
                }
            }
        });

        promise
            .then((data) => {
                const blob = new Blob([vcard.to(data)], { type: 'data:attachment/vcard;' });
                contactLoaderModal.deactivate();
                downloadFile(blob, getFileName(id, data));
            })
            .catch(contactLoaderModal.deactivate);
    };
}
export default contactDownloader;
