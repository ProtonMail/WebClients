const webapp = require('../../../e2e.utils/webapp');
const labelModal = require('../labelModal.po');
const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');
const dropdownLabel = require('../../../e2e.utils/labels/dropdownLabel')();
const { isTrue, isFalse, assertUrl, assert } = require('../../../e2e.utils/assertions');

module.exports = () => {

    const COLOR_LABEL = `New label ${Date.now()}`;
    const formModal = labelModal.form();
    const store = {
        initLabel: 0
    };

    it('should move to settings/labels', () => {
        webapp.openState('inbox')
            .then(() => browser.sleep(2000))
            .then(assertUrl('inbox'));
    });

    describe('Add label from the toolbar', () => {

        it('should not display a modal', () => {
            modal.isVisible()
                .then(isFalse);
        });

        it('should not display the dropdown', () => {
            dropdownLabel.isOpen()
                .then(isFalse);
        });

        it('should display the dropdown labels on click ', () => {
            dropdownLabel.openDropdown()
                .then(() => browser.sleep(200))
                .then(() => dropdownLabel.isOpen())
                .then(isTrue);
        });

        it('should open the modal on create', () => {
            dropdownLabel.createLabel()
                .then(() => browser.sleep(500))
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should open a modal untitled "Create new label"', () => {
            modal.title()
                .then(assert('Create new label'));
        });

        it('should add a new color and close the modal', () => {
            formModal.setName(COLOR_LABEL)
                .then(() => formModal.chooseColor(8))
                .then((color) => store.color = color)
                .then(() => formModal.submit())
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isFalse);
        });


        it('should display a notfication', () => {
            notifs.hasDisplayed()
                .then(assert('Label created'));
        });

        it('should not display a modal', () => {
            modal.isVisible()
                .then(isFalse);
        });

        it('should not display the dropdown', () => {
            dropdownLabel.isOpen()
                .then(isFalse);
            browser.sleep(6000);
        });

    });

};
