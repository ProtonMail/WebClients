module.exports = () => {

    const SELECTOR = {
        column: '#conversation-list-columns',
        row: '#conversation-list-rows',
        conversation: '.conversation',
        labels: '.labelsElement-label',
        checkbox: '.ptSelectConversation-input',
        placeholder: {
            container: '#pm_placeholder',
            title: '.numberElementSelected-title'
        },
        dropdown: {
            buttonMain: '#tour-label-dropdown',
            button: '.open-label',
            container: '.pm_dropdown',
            item: '.list-group-item',
            checkbox: '.dropdownLabels-input-label',
            archive: '.dropdownLabels-input-archive',
            buttonSave: '.dropdownLabels-btn-save'
        }
    };

    const selectorConversations = ($main) => (index) => {
        const scope = typeof index === 'undefined' ? '' : `.eq(${index})`;
        return `$(document.body.querySelector('${$main}')).find('${SELECTOR.conversation}')${scope}`.trim();
    };

    function labels(scope) {
        const count = (...names) => {
            const $titles = names.map((n) => `${SELECTOR.labels}[title="${n}"]`).join(`, `);
            return browser.executeScript(`
                return ${scope()}
                    .find('${$titles}')
                    .length;
            `);
        };

        const getByConversation = (index = 0) => {
            return browser.executeScript(`
                return ${scope(index)}
                    .find('${SELECTOR.labels}')
                    .map(function() {
                        return this.title;
                    });
            `);
        };

        return { count, getByConversation };
    }

    function editLabel() {
        const $container = `$(document.body.querySelector('${SELECTOR.dropdown.buttonMain}'))`;

        const openDropdown = () => {
            return browser.executeScript(`
                return ${$container}
                    .find('${SELECTOR.dropdown.button}')
                    .click();
            `);
        };

        const isOpen = () => {
            return browser.executeScript(`
                return ${$container}
                    .find('${SELECTOR.dropdown.container}')
                    .is(':visible');
            `);
        };

        const countLabels = () => {
            return browser.executeScript(`
                return ${$container}
                    .find('${SELECTOR.dropdown.item}')
                    .length;
            `);
        };

        const edit = (index = 0, checked = true) => {
            return browser.executeScript(`
                const $checkbox = ${$container}
                    .find('${SELECTOR.dropdown.item}')
                    .find('${SELECTOR.dropdown.checkbox}')
                    .eq(${index});

                $checkbox[0].checked = ${checked};
                $checkbox.triggerHandler('change');
            `);
        };

        const archive = (checked = true) => {
            return browser.executeScript(`
                const $checkbox = ${$container}
                    .find('${SELECTOR.dropdown.archive}');
                $checkbox[0].checked = ${checked};
                $checkbox.triggerHandler('change');
            `);
        };

        const submit = () => {
            return browser.executeScript(`
                return ${$container}
                    .find('${SELECTOR.dropdown.buttonSave}')
                    .click();
            `);
        };

        return { openDropdown, isOpen, countLabels, edit, archive, submit };
    }

    function placeholder() {

        const $container = `$(document.body.querySelector('${SELECTOR.placeholder.container}'))`;

        const isVisible = () => {
            return browser.executeScript(`
                return ${$container}
                    .is(':visible');
            `);
        };

        const countSeleted = () => {
            return browser.executeScript(`
                const $title = ${$container}
                    .find('${SELECTOR.placeholder.title}')
                    .text();
                return +$title.match(/[0-9]./)[0];
            `);
        };

        return { isVisible, countSeleted };
    }

    function load({ column = true } = {}) {

        const scope = selectorConversations(SELECTOR[column ? 'column' : 'row']);

        const select = (index = 0) => {
            return browser.executeScript(`
                $checkbox = ${scope(index)}
                    .find('${SELECTOR.checkbox}')
                    .click();
            `);
        };

        const count = () => {
            return browser.executeScript(`
                return ${scope()}.length;
            `);
        };


        return {
            count, select,
            labels: labels(scope),
            editLabel: editLabel(),
            placeholder: placeholder()
        };
    }

    return { load };

};
