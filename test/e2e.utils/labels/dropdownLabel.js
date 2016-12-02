module.exports = function editLabel() {

    const SELECTOR = {
        buttonMain: '#tour-label-dropdown',
        button: '.open-label',
        container: '.pm_dropdown',
        item: '.list-group-item',
        checkbox: '.dropdownLabels-input-label',
        archive: '.dropdownLabels-input-archive',
        buttonSave: '.dropdownLabels-btn-save'
    };

    const $container = `$(document.body.querySelector('${SELECTOR.buttonMain}'))`;

    const openDropdown = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.button}')
                .click();
        `);
    };

    const isOpen = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.container}')
                .is(':visible');
        `);
    };

    const countLabels = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.item}')
                .length;
        `);
    };

    const select = (indexes) => {
        return browser.executeScript(`
            const indexes = [${indexes}];
            const $checkbox = ${$container}
                .find('${SELECTOR.item}')
                .find('${SELECTOR.checkbox}')
                .filter((i) => indexes.indexOf(i) !== -1);

            $checkbox.click();
        `);
    };

    const unselect = (indexes = []) => {
        return browser.executeScript(`
            const indexes = [${indexes}];
            const $checkbox = ${$container}
                .find('${SELECTOR.item}')
                .find('${SELECTOR.checkbox}')
                .filter((i) => indexes.indexOf(i) !== -1);

            $checkbox.click();
        `);
    };

    const countSeleted = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.item}')
                .find('${SELECTOR.checkbox}:checked')
                .length;
        `);
    };

    const archive = () => {
        return browser.executeScript(`
            const $checkbox = ${$container}
                .find('${SELECTOR.archive}');
            $checkbox.click();
            return $checkbox[0].checked;
        `);
    };


    const isArchived = () => {
        return browser.executeScript(`
            const $checkbox = ${$container}
                .find('${SELECTOR.archive}');
            return $checkbox[0].checked;
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.buttonSave}')
                .click();
        `);
    };

    return {
        openDropdown,
        isOpen,
        countLabels,
        isArchived,
        select, unselect, countSeleted,
        archive,
        submit
    };
};
