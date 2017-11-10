angular.module('proton.contact')
    .factory('contactDownloader', (CONSTANTS, Contact, contactLoaderModal, downloadFile, vcard) => {
        return (id = 'all') => {
            let promiseCompleted = false;
            const promise = (id !== 'all') ? Contact.get(id) : Contact.exportAll();

            promise.then((contacts) => {
                contactLoaderModal.deactivate();
                promiseCompleted = true;

                const FILE_NAME = (id !== 'all' && contacts.vCard.data.fn) ? contacts.vCard.data.fn.valueOf() + '.vcf' : 'proton.vcf';
                const vCards = (id === 'all') ? contacts.map(({ vCard }) => vCard) : [contacts.vCard];
                const blob = new Blob([vcard.to(vCards)], { type: 'data:attachment/vcard;' });

                downloadFile(blob, FILE_NAME);
            }, () => {
                contactLoaderModal.deactivate();
                promiseCompleted = true;
            });

            // If the promise take too much time, we display a modal to inform the user
            setTimeout(() => {
                if (!promiseCompleted) {
                    contactLoaderModal.activate({ params: { mode: 'export', close() { contactLoaderModal.deactivate(); } } });
                }
            }, CONSTANTS.CONTACT_LOADER_DELAY);
        };
    });
