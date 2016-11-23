const composer = require('./composer.po');
const mainSuite = require('./scenarii/FLOW.test');
const simpleCCBCC = require('./scenarii/simpleCCBCC.test');
const addFileLink = require('./scenarii/addFileLink.test');
const addLink = require('./scenarii/addLink.test');
const autocomplete = require('./scenarii/autocomplete.test');
const encryption = require('./scenarii/encryption.test');
const expiration = require('./scenarii/expiration.test');

const message = {
    Subject: 'E2E: Ha que coucou',
    ToList: 'qatest123@protonmail.com',
    CCList: 'qatest123+roberto@protonmail.com',
    BCCList: 'qatest123+monique@protonmail.com',
    body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?',
    linkImage: 'https://i.imgur.com/WScAnHr.jpg',
    expiration: {
        hours: 5,
        days: 3,
        weeks: 1
    }
};

const noop = function() {};

describe('composer tests', () => {
    const editor = composer();
    mainSuite(noop, { editor, message, identifier: 'simple' });
    simpleCCBCC({ editor, message, identifier: 'simpleCCBCC' });
    autocomplete({ editor, message, identifier: 'simpleCCBCC' });
    mainSuite(addFileLink, { editor, message, identifier: 'addFileLink' });
    mainSuite(addLink, { editor, message, identifier: 'addLink' });
    mainSuite(encryption, { editor, message, identifier: 'encryption' });
    mainSuite(expiration, { editor, message, identifier: 'expiration' });

});
