module.exports = () => {

  const open = () => {
    return element(by.css('.compose.pm_button')).click();
  };

  const isOpened = () => element('.composer').isPresent();

  return { open, isOpened };
};