/* @ngInject */
function colorList(CONSTANTS) {
    const { COMPOSER_COLOR, FONT_COLOR } = CONSTANTS;
    const { white, magenta, blue, green, yellow } = FONT_COLOR;
    const CLASSNAME_ACTIVE = 'active';

    /**
     * Find active classe for type of color
     *     - color: font color
     *     - highlight: background color
     * @param  {String}  name    Color name
     * @param  {Boolean} details Mark default color as active
     * @param  {String} mode     Type of list of color (color|highlight)
     * @return {String}
     */
    const getActive = (name, details, mode) => {
        const color = COMPOSER_COLOR[mode === 'color' ? 'COLOR' : 'BACKGROUND'];
        return name === color && details ? CLASSNAME_ACTIVE : '';
    };

    /**
     * Create a color item
     * @param  {String}  name    Color name
     * @param  {Boolean} details Mark default color as active
     * @param  {String} mode     Type of list of color (color|highlight)
     * @return {String}
     */
    const template = (name, details = true, mode = 'color') => {
        const active = getActive(name, details, mode);
        return `<li class="colorList-item" style="color:${name}" data-mode="${mode}"><button class="colorList-btn-choose ${active}" data-mode="${mode}" type="button" data-color="${name}"><i class="fa fa-check" aria-hidden="true"></i></button></li>`;
    };

    const colorReducer = (details, mode) => (acc, color) => acc + template(color, details, mode);
    const list = (colors, details, mode) => `<ul class="colorList-list">${colors.reduce(colorReducer(details, mode), '')}</ul>`;
    const listReducer = (mode) => (acc, colors) => acc + list(colors, true, mode);

    return {
        replace: true,
        template: '<div class="colorList-container"></div>',
        compile(el, attr) {
            const html = [white, magenta, blue, green, yellow].reduce(listReducer(attr.mode), '');
            el[0].innerHTML = html;

            return (scope, el) => {
                const onMousedown = ({ target }) => {
                    const previous = el[0].querySelector(`.${CLASSNAME_ACTIVE}`);
                    previous && previous.classList.remove(CLASSNAME_ACTIVE);
                    target.classList.add(CLASSNAME_ACTIVE);
                };

                el.on('mousedown', onMousedown);

                scope.$on('$destroy', () => {
                    el.off('mousedown', onMousedown);
                });
            };
        }
    };
}
export default colorList;
