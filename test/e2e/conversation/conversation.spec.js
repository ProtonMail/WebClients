const webapp = require('../../e2e.utils/webapp');
const utils = require('./conversation.po')();

const columnSuite = {
    default: require('./scenarii/columns/default.test'),
    selectConversations: require('./scenarii/columns/selectConversations.test'),
    markAsRead: require('./scenarii/columns/markAsRead.test'),
    moveTo: require('./scenarii/columns/moveTo.test'),
    addLabel: require('./scenarii/columns/addLabel.test'),
    addMultiplesLabel: require('./scenarii/columns/addMultiplesLabel.test')
};

describe('Test conversations', () => {

    const column = utils.load();

    it('should load the e2e label', () => {
        webapp.openLabel('e2e')
            .then(() => browser.sleep(2000));
    });

    columnSuite.default(column);
    columnSuite.selectConversations(column);
    columnSuite.markAsRead(column);
    columnSuite.moveTo(column);
    columnSuite.addLabel(column);
    columnSuite.addMultiplesLabel(column);
});
