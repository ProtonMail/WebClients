angular.module('proton.contact')
    .factory('contactDownloader', (CONSTANTS, Contact, contactLoaderModal, contactDetailsModel, downloadFile, vcard) => {
        const getFileName = (id, [card]) => {
            const nameProperty = card.get('fn');

            if (id !== 'all' && nameProperty) {
                return `${contactDetailsModel.unescapeValue(nameProperty.valueOf())}.vcf`;
            }

            return 'proton.vcf';
        };

        return (id = 'all') => {
            const promise = (id !== 'all') ? Contact.get(id) : Contact.exportAll();

            contactLoaderModal.activate({ params: { mode: 'export', close() { contactLoaderModal.deactivate(); } } });

            promise.then((result) => {
                const vCards = (id === 'all') ? result.map(({ vCard }) => vCard) : [result.vCard];
                const fileName = getFileName(id, vCards);
                const blob = new Blob([vcard.to(vCards)], { type: 'data:attachment/vcard;' });

                contactLoaderModal.deactivate();
                downloadFile(blob, fileName);
            }, () => {
                contactLoaderModal.deactivate();
            });
        };
    });
