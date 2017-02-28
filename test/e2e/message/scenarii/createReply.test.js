const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');
const utils = require('../message.po');
const composer = require('../../composer/composer.po')();

module.exports = (store) => {

    const conversation = utils('column');
    const firstMessage = conversation.message(0);

    describe('Create a reply', () => {

        it('should not display the composer', () => {
            composer.isOpened()
                .then(isFalse);
        });

        it('should open the composer', () => {
            firstMessage.reply()
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
            firstMessage.reply('replyall')
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
            firstMessage.reply('forward')
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
            firstMessage.composeTo()
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
            firstMessage.isOpened()
                .then(isFalse);
        });

    });
};
