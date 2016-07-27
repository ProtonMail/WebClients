module.exports = () => {

  // 'composer-email-ToList'
  // 'composer-email-CCList'
  // 'composer-email-BCCList'

  const open = () => {
    return element(by.css('.compose.pm_button')).click();
  };

  const isOpened = () => browser
    .executeScript(() => {
      return document.body.querySelector('.composer') !== null;
    });

  const compose = () => {

    const content = (txt) => {

      const body = `
        const $div = $(document.body.querySelector('.composer'))
          .find('.angular-squire-wrapper')
          .find('iframe')[0]
          .contentDocument
          .body
          .querySelector('div');

          $div.textContent = '${txt}';
          return $div.textContent;
      `;
      const getTxt = Function(body);

      return browser
        .executeScript(getTxt);
    };

    return { content };
  };

  return { open, isOpened, compose };
};