import { hexToRgbString } from '../../../helpers/colorHelper';
import { FONT_COLOR } from '../../constants';

const { white, magenta, blue, green, yellow } = FONT_COLOR;

/* @ngInject */
function colorList(editorState) {
    const CLASSNAME_ACTIVE = 'active';

    /**
     * Create a color item
     * @param  {String}  hex     Color in hex format
     * @param  {String} mode     Type of list of color (color|highlight)
     * @return {String}
     */
    const template = (hex, mode = 'color') => {
        const rgb = hexToRgbString(hex);
        return `<li class="colorList-item" style="color:${rgb}" data-mode="${mode}"><button class="colorList-btn-choose" data-mode="${mode}" type="button" data-color="${rgb}"><i class="fa fa-check" aria-hidden="true"></i></button></li>`;
    };

    const colorReducer = (mode) => (acc, color) => acc + template(color, mode);
    const list = (colors, mode) => `<ul class="colorList-list">${colors.reduce(colorReducer(mode), '')}</ul>`;
    const listReducer = (mode) => (acc, colors) => acc + list(colors, mode);

    return {
        replace: true,
        template: '<div class="colorList-container"></div>',
        compile(el, attr) {
            const mode = attr.mode;

            el[0].innerHTML = [white, magenta, blue, green, yellow].reduce(listReducer(mode), '');

            const stateKey = mode === 'highlight' ? 'backgroundColor' : 'color';

            return (scope, el) => {
                const ID = scope.message.ID;

                const removeOldActive = () => {
                    const previous = el[0].querySelector(`.${CLASSNAME_ACTIVE}`);
                    previous && previous.classList.remove(CLASSNAME_ACTIVE);
                };

                const onStateChange = ({ [stateKey]: oldValue }, { [stateKey]: value }) => {
                    if (oldValue === value) {
                        return;
                    }
                    removeOldActive();
                    const button = el[0].querySelector(`[data-color="${value}"]`);
                    if (!button) {
                        return;
                    }
                    button.classList.add(CLASSNAME_ACTIVE);
                };

                onStateChange({}, editorState.get(ID));
                editorState.on(ID, onStateChange, [stateKey]);

                scope.$on('$destroy', () => {
                    editorState.off(ID, onStateChange);
                });
            };
        }
    };
}

export default colorList;
