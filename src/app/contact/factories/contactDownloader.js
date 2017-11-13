angular.module('proton.contact')
    .factory('contactDownloader', (CONSTANTS, Contact, contactLoaderModal, downloadFile, vcard) => {
        return (id = 'all') => {
            const promise = (id !== 'all') ? Contact.get(id) : Contact.exportAll();

            contactLoaderModal.activate({ params: { mode: 'export', close() { contactLoaderModal.deactivate(); } } });

            promise.then((contacts) => {
                contactLoaderModal.deactivate();

                const FILE_NAME = (id !== 'all' && contacts.vCard.data.fn) ? contacts.vCard.data.fn.valueOf() + '.vcf' : 'proton.vcf';
                const vCards = (id === 'all') ? contacts.map(({ vCard }) => vCard) : [contacts.vCard];
                const blob = new Blob([vcard.to(vCards)], { type: 'data:attachment/vcard;' });

                downloadFile(blob, FILE_NAME);
            }, () => {
                contactLoaderModal.deactivate();
            });
        };
    });
