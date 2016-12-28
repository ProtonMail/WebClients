const { isTrue, isFalse, assert } = require('../../e2e.utils/assertions');
const notifs = require('../../e2e.utils/notifications');
const dropdownLabel = require('../../e2e.utils/labels/dropdownLabel')();


module.exports = ({
    title = 'Add a label',
    archive = true,
    selected = [],
    unselected = [],
    newLabels = [],
    shouldArchivedDefault = true,
    countAlreadySelected = 0
} = {}) => {

    describe(title, () => {

        it('should not display the ', () => {
            dropdownLabel.isOpen()
                .then(isFalse);
        });

        it('should display the dropdown labels on click ', () => {
            dropdownLabel.openDropdown()
                .then(() => browser.sleep(100))
                .then(() => dropdownLabel.isOpen())
                .then(isTrue);
        });

        it('should select some options', () => {
            dropdownLabel.select(selected)
                .then(() => browser.sleep(500))
                .then(() => dropdownLabel.countSeleted())
                .then(assert(countAlreadySelected + selected.length));
        });

        it('should unselect options', () => {
            dropdownLabel.unselect(unselected)
                .then(() => browser.sleep(500))
                .then(() => dropdownLabel.countSeleted())
                .then(assert(countAlreadySelected + selected.length - unselected.length));
        });

        it('should archive by default', () => {
            browser.sleep(1000);
            dropdownLabel.isArchived()
                .then(shouldArchivedDefault ? isTrue : isFalse);
        });

        if (!archive && shouldArchivedDefault) {
            it('should unarchive options', () => {
                dropdownLabel.archive()
                    .then(() => browser.sleep(1000))
                    .then(() => dropdownLabel.isArchived())
                    .then(isFalse);
            });
        }

        if (newLabels.length) {

        }

        it('should submit labels', () => {
            dropdownLabel.submit()
                .then(() => browser.sleep(300))
                .then(() => dropdownLabel.isOpen())
                .then(isFalse);
        });

        it('should display a notfication', () => {
            browser.sleep(2000)
            notifs.message()
                .then(assert('Labels Saved'));
        });

    });
};
