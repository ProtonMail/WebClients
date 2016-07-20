module.exports = () => {

  const unstarAll = () => {
    return element
      .all(by.css('.conversation .starButton-starred .starButton-unstar'))
      .each((node) => node.click());
  };

  function conversationApi(conversation) {
    const getStarComponent = () => conversation.$('.starButton');

    const star = () => browser
      .executeScript("$('.conversation').eq(0).find('.starButton-star').click()");

    const unStar = () => browser
      .executeScript("$('.conversation').eq(0).find('.starButton-unstar').click()")

    const open = () => browser
      .executeScript("$('.conversation').eq(0).click()");



    const countMessages = () => browser
      .executeScript(`
         function countMessagesEval() {
           const list = $('#pm_thread').find('.starButton');
           return {
             list: list.length,
             starred: list.filter('.starButton-starred').length
           };
         }
        return countMessagesEval()
      `);

    return { open, getStarComponent, star, unStar, countMessages};
  }

  function messageApi(messages) {

    const star = (i) => messages.get(i).$('.starButton-star').click();
    const unStar = (i) => messages.get(i).$('.starButton-unstar').click();

    const count = () => browser
      .executeScript(`
         function countMessagesEval() {
           const list = $('#pm_thread').find('.message').find('.starButton');
           return {
             list: list.length,
             starred: list.filter('.starButton-starred').length
           };
         }
        return countMessagesEval()
      `);
    return { star, unStar, count };
  }

  const loadConversation = () => {
    const conversation = element.all(by.css('.conversation')).get(0);
    return conversationApi(conversation);
  };

  const loadOpenedConversation = () => {
    const header = element(by.id('conversationHeader'));
    const messages = element(by.id('pm_thread')).$$('.message');
    return {
      header: conversationApi(header),
      messages: messageApi(messages)
    };
  };


  return { unstarAll, loadConversation, loadOpenedConversation };
};