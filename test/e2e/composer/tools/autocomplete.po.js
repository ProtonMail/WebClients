module.exports = (key) => {
    const SELECTOR = {
        ToList: '.composer-field-ToList',
        CCList: '.composer-field-CCList',
        BCCList: '.composer-field-CCList'
    };

    const container = SELECTOR[key];

    const inputValue = () => {
        return browser.executeScript(`
            const $form = $('${container}').find('form.composerInputMeta-autocomplete');
            return $form.find('input').val();
        `);
    };

    const listIsVisible = () => {
        return browser.executeScript(`
            const $form = $('${container}').find('form.composerInputMeta-autocomplete');

            $form.find('input').click();

            return $form.find('input + ul').is(':visible');
        `);
    };

    const countLabels = () => {
        return browser.executeScript(`
            const $form = $('${container}').find('form.composerInputMeta-autocomplete');
            return $form.find('.autocompleteEmails-item').length;
        `);
    };

    const isInvalidLabel = (index = 0) => {
        return browser.executeScript(`
            return $('${container}')
                .find('form.composerInputMeta-autocomplete')
                .find('.autocompleteEmails-item')
                .eq(${index})
                .hasClass('autocompleteEmails-item-invalid');
        `);
    };

    const getLabels = (index = 0) => {
        return browser.executeScript(`
            return $('${container}')
                .find('form.composerInputMeta-autocomplete')
                .find('.autocompleteEmails-item')
                .eq(${index})
                .find('.autocompleteEmails-btn-remove')
                .attr('data-address');
        `);
    };

    const removeLabel = (index = 0) => {
        return browser.executeScript(`
            $('${container}')
                .find('form.composerInputMeta-autocomplete')
                .find('.autocompleteEmails-item')
                .eq(${index})
                .find('.autocompleteEmails-btn-remove')
                .click();
        `);
    };
    return {
        inputValue,
        listIsVisible,
        countLabels,
        isInvalidLabel,
        getLabels,
        removeLabel
    };
};
