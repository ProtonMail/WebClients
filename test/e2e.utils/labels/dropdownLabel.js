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

    const edit = (index = 0, checked = true) => {
        return browser.executeScript(`
            const $checkbox = ${$container}
                .find('${SELECTOR.item}')
                .find('${SELECTOR.checkbox}')
                .eq(${index});

            $checkbox[0].checked = ${checked};
            $checkbox.triggerHandler('change');
        `);
    };

    const archive = (checked = true) => {
        return browser.executeScript(`
            const $checkbox = ${$container}
                .find('${SELECTOR.archive}');
            $checkbox[0].checked = ${checked};
            $checkbox.triggerHandler('change');
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            return ${$container}
                .find('${SELECTOR.buttonSave}')
                .click();
        `);
    };

    return { openDropdown, isOpen, countLabels, edit, archive, submit };
};
