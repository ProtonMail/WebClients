const webapp = require('../../../e2e.utils/webapp');
const label = require('../label.po')();
const labelModal = require('../labelModal.po');
const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');
const { isTrue, isFalse, assertUrl, assert, greaterThan } = require('../../../e2e.utils/assertions');

module.exports = () => {

    describe('Label settings', () => {

        const COLOR_LABEL = `New label ${Date.now()}`;
        const COLOR_LABEL_UPDATED = `Updated label ${Date.now()}`;
        const listLabel = label.list();
        const messageLabel = label.messages();
        const formModal = labelModal.form();
        const store = {
            initLabel: 0
        };

        it('should move to settings/labels', () => {
            webapp.goToMenu('settings', 'header')
                .then(() => browser.sleep(1000))
                .then(() => webapp.goToMenu('labels'))
                .then(() => browser.sleep(1000))
                .then(assertUrl('labels'));

            listLabel.length()
                .then((total) => (store.initLabel = total, total))
                .then(greaterThan(0));
        });

        it('should not display a modal', () => {
            modal.isVisible()
                .then(isFalse);
        });

        it('should display any messages', () => {
            messageLabel.isVisible()
                .then(isFalse);
        });

        it('should open the modal on add', () => {
            label.add()
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
                .then(() => formModal.chooseColor(13))
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

        it('should add a new color to the list', () => {
            listLabel.length()
                .then((total) => (store.newList = total, total))
                .then(assert(store.initLabel + 1));
        });

        it('should create a label with the valid color', () => {
            const item = listLabel.item(store.initLabel);
            item.getColor()
                .then(assert(store.color));
        });

        it('should create a label with the valid name', () => {
            const item = listLabel.item(store.initLabel);
            item.content()
                .then(assert(COLOR_LABEL));
        });

        describe('edit the label', () => {

            it('should not display a modal', () => {
                browser.sleep(6000);
                modal.isVisible()
                    .then(isFalse);
            });

            it('should open a modal', () => {
                const item = listLabel.item(store.initLabel);
                item.edit()
                    .then(() => browser.sleep(500))
                    .then(() => modal.isVisible())
                    .then(isTrue);
            });

            it('should open a modal untitled', () => {
                modal.title()
                    .then(assert('Edit label'));
            });

            it('should update the color and close the modal', () => {
                formModal.setName(COLOR_LABEL_UPDATED)
                    .then(() => formModal.chooseColor(15))
                    .then((color) => store.color = color)
                    .then(() => formModal.submit())
                    .then(() => browser.sleep(1000))
                    .then(() => modal.isVisible())
                    .then(isFalse);
            });

            it('should display a notfication', () => {
                notifs.hasDisplayed()
                    .then(assert('Label edited'));
            });

            it('should not add new color to the list', () => {
                listLabel.length()
                    .then(assert(store.initLabel + 1));
            });

            it('should update the label with the valid color', () => {
                const item = listLabel.item(store.initLabel);
                item.getColor()
                    .then(assert(store.color));
            });

            it('should update thelabel with the valid name', () => {
                const item = listLabel.item(store.initLabel);
                item.content()
                    .then(assert(COLOR_LABEL_UPDATED));
            });
        });

        describe('delete the label', () => {

            it('should not display a modal', () => {
                browser.sleep(6000);
                modal.isVisible()
                    .then(isFalse);
            });

            it('should open a modal', () => {
                const item = listLabel.item(store.initLabel);
                item.remove()
                    .then(() => browser.sleep(1000))
                    .then(() => modal.isVisible())
                    .then(isTrue);
            });

            it('should open a modal untitled', () => {
                modal.title()
                    .then(assert('Delete label'));
            });

            it('should contains a question', () => {
                modal.read()
                    .then(assert('Are you sure you want to delete this label? Removing a label will not remove the messages with that label.'));
            });


            it('should close the modal on cancel', () => {
                modal.cancel()
                    .then(() => browser.sleep(1000))
                    .then(() => modal.isVisible())
                    .then(isFalse);
            });

            it('should open a modal', () => {
                const item = listLabel.item(store.initLabel);
                item.remove()
                    .then(() => browser.sleep(500))
                    .then(() => modal.isVisible())
                    .then(isTrue);
            });

            it('should close the modal on confirm', () => {
                modal.confirm()
                    .then(() => browser.sleep(1000))
                    .then(() => modal.isVisible())
                    .then(isFalse);
            });

            it('should remove a label inside the list', () => {
                listLabel.length()
                    .then(assert(store.initLabel));
            });

            it('should display a notfication', () => {
                notifs.hasDisplayed()
                    .then(assert('Label deleted'));
                browser.sleep(6000);
            });

        });
    });


};
