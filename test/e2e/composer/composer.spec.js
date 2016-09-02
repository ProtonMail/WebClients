const composer = require('./composer.po');
const message = {
  Subject: 'JO: Ha que coucou',
  ToList: 'qatest1@protonmail.com',
  CCList: 'qatest2@protonmail.com',
  BCCList: 'qatest3@protonmail.com',
  body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?'
};

describe('composer tests', () => {
  const editor = composer();

  describe('Composer simple message', () => {

    let borodin;

    it('should open a the composer', () => {
      editor.open();
      browser.sleep(500);
      editor
        .isOpened()
        .then(test => {
          borodin = editor.compose();
          expect(test).toEqual(true)
        });
    })

    it('should create a new message', () => {
      borodin
        .content(message.body)
        .then((text) => {
          expect(text).toEqual(message.body);
        })
    })

    it('should add a recepient', () => {
      borodin
        .fillInput('ToList', message.ToList)
        .then((text) => {
          expect(text).toEqual(message.ToList);
        })
    })

    it('should add a subject', () => {
      borodin
        .fillInput('Subject', message.Subject)
        .then((text) => {
          expect(text).toEqual(message.Subject);
        })
    })

    it('should send the message', () => {
      borodin
        .send()
        .then(() => browser.sleep(5000))
        .then(() => {
          borodin
            .isOpened()
            .then((editor) => {
              expect(editor).toEqual(false);
            });
        });
    })

    // it('should hide the composer', () => {
    // })

    // it('should add a new conversation', () => {
    // })
  })


});