module.exports = () => {

  const open = () => {
    return element(by.id('tour-support'))
      .click()
      .then(() => element(by.id('reportBugBtn')).click());
  };

  return { open };
};