const composer = require('./composer.po');
const simple = require('./scenarii/simple.test');
const simpleCCBCC = require('./scenarii/simpleCCBCC.test');

const message = {
    Subject: 'E2E: Ha que coucou',
    ToList: 'qatest123@protonmail.com',
    CCList: 'qatest123+roberto@protonmail.com',
    BCCList: 'qatest123+monique@protonmail.com',
    body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?'
};

describe('composer tests', () => {
    const editor = composer();
    simple(editor, message);
    simpleCCBCC(editor, message);

});
