const modalTest = require('../helpers/modals.cy');

const suite = (modal) => () => {
    const CACHE = {};

    const getErrors = () => ({
        required: modal.selector('[ng-message="required"]'),
        isValid: modal.selector('[ng-message="validLabel"]')
    });

    const setName = (value = '', { invalid = false, required = false } = {}) => {
        const input = modal.selector('.labelModal-input-name');
        input.clear();

        if (invalid) {
            input.type('lol<>lol');
            input.type('lol<>lol');
            input.blur();

            const isValid = modal.selector('[ng-message="validLabel"] span');
            isValid.should('be.visible');
            isValid.should('contain', 'Invalid name. Forbidden char. ex:');
            return modal.selector('[ng-message="required"]').should('not.exist');
        }

        if (required) {
            input.blur();

            const required = modal.selector('[ng-message="required"]');
            required.should('be.visible');
            required.should('contain', 'You must set a name');
            return modal.selector('[ng-message="validLabel"]').should('not.exist');
        }

        input.type(value);
        input.blur();

        modal.selector('[ng-message="validLabel"]').should('not.exist');
        modal.selector('[ng-message="required"]').should('not.exist');
    };

    const setColor = (hex) => {
        if (!hex) {
            const color = modal.selector('.labelModal-input-color:checked');
            color.should('exist');
            return color.then((input) => {
                CACHE.color = input.val();
            });
        }

        modal.selector(`.labelModal-input-color[value="${hex}"]`).check({ force: true });
        modal.selector('.labelModal-input-color:checked').should('have.value', hex);
    };

    const getColor = () => CACHE.color;
    const save = () => modal.selector('.labelModal-btn-save').click();
    const close = modal.close;
    const selector = modal.selector;
    const closeCross = modal.closeCross;
    const isOpen = modal.isOpen;

    return {
        isOpen,
        selector,
        getErrors,
        getColor,
        setName,
        setColor,
        save,
        close,
        closeCross
    };
};

module.exports = {
    addLabel: suite(
        modalTest({
            type: 'editLabelForm',
            title: 'Create new label'
        })
    ),
    addFolder: suite(
        modalTest({
            type: 'editLabelForm',
            title: 'Create new folder'
        })
    )
};
