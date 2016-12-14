const SELECTOR = {
    container: '#pm_toolbar-desktop',
    allElements: '.toolBar-select-all'
};

const selectAll = () => {
    return browser.executeScript(`
        const $checkbox = $('${SELECTOR.container}')
            .find('${SELECTOR.allElements}');

        $checkbox.click();
        return $checkbox[0].checked;
    `);
};

module.exports = { selectAll };
