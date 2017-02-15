const webapp = require('../../../e2e.utils/webapp');
const { isTrue, isFalse, greaterThan, assert } = require('../../../e2e.utils/assertions');
const utils = require('../message.po');
const composer = require('../../composer/composer.po')();

module.exports = () => {

    describe('View: column', () => {

        const INDEX = 0;
        const conversation = utils('column');
        const list = conversation.conversation();
        const message = conversation.message(INDEX);

        const store = {};

        it('should load the e2e-scenario label', () => {
            webapp.openLabel('e2e-scenario')
                .then(() => browser.sleep(2000));
        });

        it('should not have any conversation opened', () => {
            list.isVisible()
                .then(isFalse);
        });

        it('should open the first conversation', () => {
            conversation.open(INDEX)
                .then(() => browser.sleep(1000))
                .then(() => list.isVisible())
                .then(isTrue);
        });

        it('should contains severals messages', () => {
            list.count()
                .then(greaterThan(0));
        });

        it('should bind the number of item inside the title', () => {
            list.getTitle()
                .then((data) => (store.title = data, data.number))
                .then(() => list.count())
                .then((total) => assert(+store.title.number)(total));
        });

        it('should not display the latest message details', () => {
            list.isDetailsVisibleLatest()
                .then(isFalse);
        });

        it('should display only the latest message body', () => {
            list.isBodyVisibleForLatest()
                .then(isTrue);
        });

        describe('Open a message', () => {

            it('should not be opened', () => {
                message.isOpened()
                    .then(isFalse);
            });

            it('should open the message', () => {
                message.open()
                    .then(() => browser.sleep(500))
                    .then(() => message.isOpened())
                    .then(isTrue);
            });

        });

        describe('toggle details', () => {

            it('should display the details', () => {
                message.toggleDetails()
                    .then(() => message.isDetailsVisible())
                    .then(isTrue);
            });

            it('should not display the latest message details', () => {
                list.isDetailsVisibleLatest()
                    .then(isFalse);
            });

            it('should display the details', () => {
                message.toggleDetails()
                    .then(() => message.isDetailsVisible())
                    .then(isFalse);
            });
        });

        describe('Create a reply', () => {

            it('should not display the composer', () => {
                composer.isOpened()
                    .then(isFalse);
            });

            it('should open the composer', () => {
                message.reply()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === true);
                    }, 15000))
                    .then(isTrue);
            });

            it('should prepend Re: to the title', () => {
                composer.getSubject()
                    .then((subject) => assert(`Re: ${store.title.title}`)(subject));
            });

            it('should close the composer', () => {
                composer.close()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === false);
                    }, 15000))
                    .then(() => composer.isOpened())
                    .then(isFalse);
            });

        });

        describe('Create a reply all', () => {

            it('should not display the composer', () => {
                composer.isOpened()
                    .then(isFalse);
            });

            it('should open the composer', () => {
                message.reply('replyall')
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === true);
                    }, 15000))
                    .then(isTrue);
            });

            it('should prepend Re: to the title', () => {
                composer.getSubject()
                    .then((subject) => assert(`Re: ${store.title.title}`)(subject));
            });

            it('should close the composer', () => {
                composer.close()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === false);
                    }, 15000))
                    .then(() => composer.isOpened())
                    .then(isFalse);
            });

        });

        describe('Create a forward', () => {

            it('should not display the composer', () => {
                composer.isOpened()
                    .then(isFalse);
            });

            it('should open the composer', () => {
                message.reply('forward')
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === true);
                    }, 15000))
                    .then(isTrue);
            });

            it('should prepend Fw: to the title', () => {
                composer.getSubject()
                    .then((subject) => assert(`Fw: ${store.title.title}`)(subject));
            });

            it('should close the composer', () => {
                composer.close()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === false);
                    }, 15000))
                    .then(() => composer.isOpened())
                    .then(isFalse);
            });

        });

        describe('Open the composer from addresses', () => {

            it('should not display the composer', () => {
                composer.isOpened()
                    .then(isFalse);
            });

            it('should open the composer', () => {
                message.composeTo()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === true);
                    }, 15000))
                    .then(isTrue);
            });

            it('should set New message as title', () => {
                composer.getSubject()
                    .then(assert('New message'));
            });

            it('should close the composer', () => {
                composer.close()
                    .then(() => browser.wait(() => {
                        return composer.isOpened()
                            .then((test) => test === false);
                    }, 15000))
                    .then(() => composer.isOpened())
                    .then(isFalse);
            });

            it('should close the message', () => {
                browser.sleep(3000);
                message.isOpened()
                    .then(isFalse);
            });

        });

    });
};
