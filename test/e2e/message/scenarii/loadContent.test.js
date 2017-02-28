const { isTrue, isFalse } = require('../../../e2e.utils/assertions');
const utils = require('../message.po');

module.exports = () => {

    const INDEX = 1;
    const INDEX_CONTENT_LOADING = 0;
    const conversation = utils('column');
    const list = conversation.conversation();

    describe('Display load content buttons', () => {

        const message = conversation.message(INDEX_CONTENT_LOADING);
        const loadEmbedded = message.loadContent('embedded');
        const loadRemote = message.loadContent('remote');

        it('should open the second conversation', () => {
            conversation.open(INDEX_CONTENT_LOADING)
                .then(() => browser.sleep(3000))
                .then(() => list.isVisible())
                .then(isTrue);
        });

        it('should display the load remote content button', () => {
            loadRemote.isVisible()
                .then(isTrue);
        });

        it('should display the load embedded content button', () => {
            loadEmbedded.isVisible()
                .then(isTrue);
        });

        it('should open the second conversation', () => {
            conversation.open(INDEX)
                .then(() => browser.sleep(1000))
                .then(() => conversation.open(INDEX_CONTENT_LOADING))
                .then(() => browser.sleep(3000))
                .then(() => list.isVisible())
                .then(isTrue);
        });

        it('should display the load remote content button', () => {
            loadRemote.isVisible()
                .then(isTrue);
        });

        it('should display the load embedded content button', () => {
            loadEmbedded.isVisible()
                .then(isTrue);
        });

        it('should not load remote content', () => {
            loadRemote.hasLoaded()
                .then(isFalse);
        });

        it('should not load embedded content', () => {
            loadEmbedded.hasLoaded()
                .then(isFalse);
        });

        it('should load the remote content on click', () => {
            loadRemote.click()
                .then(() => browser.wait(() => {
                    return loadRemote.hasLoaded()
                        .then((test) => test === true);
                }, 25000))
                .then(() => loadRemote.hasLoaded())
                .then(isTrue);
        });

        it('should hide the remote content button', () => {
            loadRemote.isVisible()
                .then(isFalse);
        });

        it('should load the embedded content on click', () => {
            loadEmbedded.click()
                .then(() => browser.wait(() => {
                    return loadEmbedded.hasLoaded()
                        .then((test) => test === true);
                }, 25000))
                .then(() => loadEmbedded.hasLoaded())
                .then(isTrue);
        });

        it('should hide the embedded content button', () => {
            loadEmbedded.isVisible()
                .then(isFalse);
        });

    });
};
