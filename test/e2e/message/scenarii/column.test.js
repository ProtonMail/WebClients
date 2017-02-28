const webapp = require('../../../e2e.utils/webapp');
const { isTrue, isFalse, greaterThan, assert } = require('../../../e2e.utils/assertions');
const utils = require('../message.po');
const composer = require('../../composer/composer.po')();

module.exports = () => {

    describe('View: column', () => {

        const INDEX = 1;
        const INDEX_CONTENT_LOADING = 0;
        const conversation = utils('column');
        const list = conversation.conversation();
        const firstMessage = conversation.message(0);

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

        describe('Open the first message', () => {

            it('should not be opened', () => {
                firstMessage.isOpened()
                    .then(isFalse);
            });

            it('should open the message', () => {
                firstMessage.open()
                    .then(() => browser.sleep(2000))
                    .then(() => firstMessage.isOpened())
                    .then(isTrue);
            });

        });

        describe('toggle details', () => {

            it('should display the details', () => {
                firstMessage.toggleDetails()
                    .then(() => firstMessage.isDetailsVisible())
                    .then(isTrue);
            });

            it('should not display the latest message details', () => {
                list.isDetailsVisibleLatest()
                    .then(isFalse);
            });

            it('should display the details', () => {
                firstMessage.toggleDetails()
                    .then(() => firstMessage.isDetailsVisible())
                    .then(isFalse);
            });
        });

        require('./createReply.test')(store);
        require('./loadContent.test')();

    });
};
