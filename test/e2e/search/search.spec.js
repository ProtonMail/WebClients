const utils = require('./search.po')();
const { isTrue, isFalse, assert, assertUrl } = require('../../e2e.utils/assertions');

const SEARCH_EMPTY = 'monique sur seine';
const SEARCH_2 = 'polo';
const DATE = {
    start: '01/01/2017',
    end: '02/01/2017'
};

const dateUnix = (date) => Math.abs(+new Date(date)/1000);

describe('Search messages', () => {

    const { simple, advanced } = utils;

    it('should display the message input', () => {
        simple.isVisible()
            .then(isTrue);
    });

    it('should not display the advanced one', () => {
        advanced.isVisible()
            .then(isFalse);
    });

    it('should change the url on submit', () => {
        simple.search(SEARCH_EMPTY)
            .then(() => simple.submit())
            .then(() => browser.sleep(1000))
            .then(assertUrl(`search?keyword=${encodeURI(SEARCH_EMPTY)}`));
    });

    it('should empty the input on escape', () => {
        simple.search(SEARCH_EMPTY)
            .then(() => simple.cancel())
            .then(() => browser.sleep(1000))
            .then(() => simple.getValue())
            .then(assert(''));
    });

    it('should get no results', () => {
        utils.isEmpty()
            .then(isTrue);
    });

    describe('advanced', () => {

        it('should display it on toggle', () => {
            advanced.toggle()
                .then(() => browser.sleep(300))
                .then(() => advanced.isVisible())
                .then(isTrue);
        });

        it('should should contains the current search', () => {
            advanced.getValue('keyword')
                .then(assert(SEARCH_EMPTY));
        });

        it('should change the url on submit', () => {
            advanced.custom(SEARCH_2)
                .then(() => advanced.submit())
                .then(() => browser.sleep(1000))
                .then(assertUrl(`search?from=polo&to=polo&keyword=${encodeURI(SEARCH_2)}&attachments=2`));
        });

    });
});
