const { isTrue, isFalse } = require('../../e2e.utils/assertions');
const dropdownLabel = require('../../e2e.utils/labels/dropdownLabel')();


module.exports = ({ archive = true, selected: [], newLabel = {} } = {}) => {
    describe('Add a label', () => {

        it('should not display the ', () => {
            dropdownLabel.isOpen()
                .then(isFalse);
        });

        it('should display the dropdown labels on click ', () => {
            dropdownLabel.openDropdown()
                .then(() => browser.sleep(500))
                .then(() => dropdownLabel.isOpen())
                .then(isTrue);
        });

    });
};
