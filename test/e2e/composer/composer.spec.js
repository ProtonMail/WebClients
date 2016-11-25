const composer = require('./composer.po');
const mainSuite = require('./scenarii/FLOW.test');
const simpleCCBCC = require('./scenarii/simpleCCBCC.test');
const noSubject = require('./scenarii/noSubject.test');
const saveDraft = require('./scenarii/saveDraft.test');
const discardDraft = require('./scenarii/discardDraft.test');
const addFileLink = require('./scenarii/addFileLink.test');
const addLink = require('./scenarii/addLink.test');
const autocomplete = require('./scenarii/autocomplete.test');
const encryption = require('./scenarii/encryption.test');
const expiration = require('./scenarii/expiration.test');
const uploadFile = require('./scenarii/uploadFile.test');

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


const editor = composer();

// mainSuite(noop, { editor, message, identifier: 'simple' });
// simpleCCBCC({ editor, message, identifier: 'simpleCCBCC' });
// mainSuite(noSubject, { editor, message, identifier: 'noSubject' }, {
//     send: false,
//     subject: false
// });
// autocomplete({ editor, message, identifier: 'simpleCCBCC' });
// mainSuite(addFileLink, { editor, message, identifier: 'addFileLink' });
// mainSuite(addLink, { editor, message, identifier: 'addLink' });
// mainSuite(encryption, { editor, message, identifier: 'encryption' });
// mainSuite(expiration, { editor, message, identifier: 'expiration' });

// mainSuite(saveDraft, { editor, message, identifier: 'saveDraft' }, {
//     send: false
// });

// function complexSuite(data) {
//     addFileLink(data);
//     addLink(data);
//     encryption(data);
//     expiration(data);
// }
// mainSuite(complexSuite, {
//     editor, message,
//     identifier: 'expiration.encryption.link.file'
// });

// mainSuite(discardDraft, { editor, message, identifier: 'discardDraft' }, {
//     send: false
// });

mainSuite(uploadFile, { editor, message, identifier: 'uploadFile' }, {
    send: false
});


