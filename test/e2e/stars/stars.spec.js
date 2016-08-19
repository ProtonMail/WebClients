const ations = require('./stars.po');

describe('Star actions tests', () => {
  const page = ations();
  let conversation;

    beforeEach(() => {
      conversation = page.loadConversation();
      browser.sleep(1000)
    });

  it('should unstarAll', () => {
    page.unstarAll();
  });

  describe('Star a conversation', () => {

    describe('Toggle star', () => {

      it('should star a conversation', () => {
        conversation.star()
        .then(() => {
          expect(conversation.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
        })
      })

      it('should unstar a conversation', () => {
        conversation
          .unStar()
          .then(() => {
            expect(conversation.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
          })

      })

    });

    describe('Star from an openend conversation', () => {
      let openend;


      it('should star all the messages', () => {

        // Dunno why it will toggle stars if it's the beforeEach...
        conversation.open();
        openend = page.loadOpenedConversation().header;
        browser.sleep(1000)
        openend.star();
        browser.sleep(500)

        openend
          .countMessages()
          .then(({ list, starred }) => {
            expect(list).toEqual(starred);
          });
      })

      it('should star the conversation', () => {
        openend = page.loadOpenedConversation().header;
        expect(openend.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
      })

      it('should also put the conversation as starred into the column', () => {
        openend = page.loadOpenedConversation().header;
        expect(conversation.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
      })

    });

    describe('UnStar from an openend conversation', () => {

      let openend;
      beforeEach(() => {
        openend = page.loadOpenedConversation().header;
      })

      it('should unstar all the messages', () => {
        conversation.open();
        browser.sleep(1000)
        openend.unStar();
        browser.sleep(500)

        openend
          .countMessages()
          .then(({ starred }) => {
            expect(starred).toEqual(0);
          });
      })

      it('should unstar the conversation', () => {
        expect(openend.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
      })

      it('should unstar the conversation into the column', () => {
        expect(conversation.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
      })

    });
  });


  describe('Star a message', () => {

    let messages;
    beforeEach(() => {
      messages = page.loadOpenedConversation().messages;
    })

    describe('Toggle star', () => {

      it('should star', () => {
        conversation.open();
        browser.sleep(1000)
        messages
          .star(0)
          .then(() => {

            messages
              .count()
              .then(({ starred }) => {
                expect(starred).toBe(1);
              })

          })
      })

      it('should unstar', () => {
          messages
            .unStar(0)
            .then(() => {

              messages
                .count()
                .then(({ starred }) => {
                  expect(starred).toBe;
                })

            })
     })

    });

    describe('One message', () => {

      let header, messages;

      beforeEach(() => {
        const items =  page.loadOpenedConversation();
        header = items.header;
        messages = items.messages;
      })

      describe('Star', () => {
        it('should star the conversation', () => {
          messages
            .star(0)
            .then(() => {
              expect(header.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
            })
        })

        it('should star the conversation into the column', () => {
          browser.sleep(100)
          expect(conversation.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
        })
      })

      describe('UnStar', () => {
        it('should unstar the conversation', () => {
          messages
            .unStar(0)
            .then(() => {
              expect(header.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
            })
        })

        it('should unstar the conversation into the column', () => {
          browser.sleep(100)
          expect(conversation.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
        })
      })

    });

    describe('Many messages', () => {

      let header, messages;

      beforeEach(() => {
        const items =  page.loadOpenedConversation();
        header = items.header;
        messages = items.messages;
      })

      describe('Star', () => {
        it('should star the conversation', () => {
          messages
            .star(0)
            .then(() => messages.star(1))
            .then(() => {
              expect(header.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
            })
        })

        it('should star the conversation into the column', () => {
          browser.sleep(100)
          expect(conversation.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
        })
      })

      describe('UnStar one message', () => {
        it('should not unstar the conversation', () => {
          messages
            .unStar(0)
            .then(() => {
              expect(header.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
            })
        })

        it('should not unstar the conversation into the column', () => {
          browser.sleep(100)
          expect(conversation.getStarComponent().getAttribute('class')).toMatch(/starButton-starred/);
        })
      })

      describe('UnStar all messages', () => {
        it('should unstar the conversation', () => {
          messages
            .unStar(1)
            .then(() => {
              expect(header.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
            })
        })

        it('should unstar the conversation into the column', () => {
          browser.sleep(100)
          expect(conversation.getStarComponent().getAttribute('class')).not.toMatch(/starButton-starred/);
        })
      })

    })


  });



});