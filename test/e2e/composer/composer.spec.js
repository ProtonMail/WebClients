const composer = require('./composer.po');
const simple = require('./scenarii/simple.test');
const simpleCCBCC = require('./scenarii/simpleCCBCC.test');
const addFileLink = require('./scenarii/addFileLink.test');
const addLink = require('./scenarii/addLink.test');
const autocomplete = require('./scenarii/autocomplete.test');
const encryption = require('./scenarii/encryption.test');

const message = {
    Subject: 'E2E: Ha que coucou',
    ToList: 'qatest123@protonmail.com',
    CCList: 'qatest123+roberto@protonmail.com',
    BCCList: 'qatest123+monique@protonmail.com',
    body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?',
    linkImage: 'https://i.imgur.com/WScAnHr.jpg'
};

describe('composer tests', () => {
    const editor = composer();
    simple(editor, message, { identifier: 'simple' });
    simpleCCBCC(editor, message, { identifier: 'simpleCCBCC' });
    addFileLink(editor, message, { identifier: 'addFileLink' });
    addLink(editor, message, { identifier: 'addLink' });
    autocomplete(editor, message, { identifier: 'autocomplete' });
    encryption(editor, message, { identifier: 'encryption' });

});
