const webapp = require('../../e2e.utils/webapp');
const utils = require('./conversation.po')();
const toolbar = require('../../e2e.utils/toolbar');
const notifs = require('../../e2e.utils/notifications');
const { isTrue, assert } = require('../../e2e.utils/assertions');
const suite = {
    markAsRead: require('./scenarii/markAsRead.test'),
    moveTo: require('./scenarii/moveTo.test'),
    column: {
        default: require('./scenarii/columns/default.test'),
        selectConversations: require('./scenarii/columns/selectConversations.test'),
        addLabel: require('./scenarii/columns/addLabel.test'),
        addMultiplesLabel: require('./scenarii/columns/addMultiplesLabel.test')
    },
    rows: {
        default: require('./scenarii/rows/default.test'),
        selectConversations: require('./scenarii/rows/selectConversations.test'),
        addLabel: require('./scenarii/rows/addLabel.test'),
        addMultiplesLabel: require('./scenarii/rows/addMultiplesLabel.test')
    }
};

describe('Test conversations', () => {

    const column = utils.load();

    it('should load the e2e label', () => {
        webapp.openLabel('e2e')
            .then(() => browser.sleep(2000));
    });

    describe('Layout: column', () => {
        suite.column.default(column);
        suite.column.selectConversations(column);
        suite.markAsRead(column);
        suite.moveTo(column);
        suite.column.addLabel(column);
        suite.column.addMultiplesLabel(column);
    });

    describe('Changing the layout', () => {

        it('should be column as default', () => {
            webapp.isLayout('column')
                .then(isTrue);
        });

        it('should switch to row', () => {
            toolbar.layout('rows')
                .then(() => browser.sleep(2000))
                .then(() => webapp.isLayout('rows'))
                .then(isTrue);
        });

        it('should display a notfication', () => {
            browser.wait(() => {
                return notifs.isOpened()
                    .then((test) => test === true);
            }, 10000)
                .then(() => notifs.message())
                .then(assert('Layout saved'));
        });

        it('should switch to column', () => {
            toolbar.layout('column')
                .then(() => browser.sleep(2000))
                .then(() => webapp.isLayout('column'))
                .then(isTrue);
        });
    });

    describe('Layout: rows', () => {
        const row = utils.load({ column: false });

        it('should switch to row', () => {
            toolbar.layout('rows')
                .then(() => browser.sleep(2000))
                .then(() => webapp.isLayout('rows'))
                .then(isTrue);
            browser.sleep(2000);
        });

        suite.rows.default(row);
        suite.rows.selectConversations(row);
        suite.markAsRead(row);
        suite.moveTo(row);
        suite.rows.addLabel(row);
        suite.rows.addMultiplesLabel(row);

        it('should switch to column', () => {
            toolbar.layout('column')
                .then(() => browser.sleep(2000))
                .then(() => webapp.isLayout('column'))
                .then(isTrue);
        });
    });
});
