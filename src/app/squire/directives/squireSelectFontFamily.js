import _ from 'lodash';

/* @ngInject */
function squireSelectFontFamily(editorState) {
    const IS_OPEN = 'squireDropdown-is-open';
    const MAP = {
        georgia: 'Georgia',
        arial: 'Arial',
        verdana: 'Verdana',
        tahoma: 'Tahoma',
        'trebuchet ms': 'Trebuchet MS',
        helvetica: 'Helvetica',
        'times new roman': 'Times New Roman',
        menlo: 'Monospace',
        consolas: 'Monospace',
        'courier new': 'Monospace',
        monospace: 'Monospace'
    };
    const KEYS = Object.keys(MAP);

    const getFont = (font) => {
        const key = _.find(KEYS, (key) => new RegExp(key).test(font));
        return MAP[key];
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectFontFamily.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];
            const value = el.querySelector('.value');

            const onStateChange = ({ popover: oldPopover, font: oldFont }, { popover, font = '' }) => {
                if (oldFont !== font) {
                    value.textContent = getFont(font);
                    el.setAttribute('data-font-family', font);
                }
                if (popover === 'changeFontFamily') {
                    el.classList.add(IS_OPEN);
                    const [firstFont] = font.split(' ');
                    const item = el.querySelector(`[data-value^="${firstFont}"]`);

                    if (item) {
                        // To prevent scrolling the whole page, just the dropdown.
                        item.parentNode.scrollTop = item.offsetTop;
                    }
                } else if (oldPopover === 'changeFontFamily') {
                    el.classList.remove(IS_OPEN);
                }
            };

            onStateChange({}, editorState.get(ID));
            editorState.on(ID, onStateChange, ['popover', 'font']);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
            });
        }
    };
}

export default squireSelectFontFamily;
