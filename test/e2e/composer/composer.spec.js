const composer = require('./composer.po');
const simple = require('./scenarii/simple.test');

const message = {
    Subject: 'JO: Ha que coucou',
    ToList: 'qatest1@protonmail.com',
    CCList: 'qatest2@protonmail.com',
    BCCList: 'qatest3@protonmail.com',
    body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?'
};

describe('composer tests', () => {
    const editor = composer();
    simple(editor, message);

});
