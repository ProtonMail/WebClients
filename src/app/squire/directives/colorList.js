angular.module('proton.squire')
    .directive('colorList', (CONSTANTS, $rootScope) => {

        const { white, magenta, blue, green, yellow } = CONSTANTS.FONT_COLOR;
        const CLASSNAME_ACTIVE = 'active';
        const COMPOSER_COLOR = '#222222';

        const template = (name) => {
            const active = (name === COMPOSER_COLOR) ? CLASSNAME_ACTIVE : '';
            return `<li class="colorList-item" style="color:${name}"><button class="colorList-btn-choose ${active}" type="button" data-color="${name}"><i class="fa fa-check" aria-hidden="true"></i></button></li>`;
        };

        const colorReducer = (acc, color) => acc + template(color);
        const list = (colors) => `<ul class="colorList-list">${colors.reduce(colorReducer, '')}</ul>`;
        const listReducer = (acc, colors) => acc + list(colors);

        return {
            replace: true,
            template: '<div class="colorList-container"></div>',
            compile(el, attr) {

                const isEmpty = _.has(attr, 'isEmpty');

                if (!isEmpty) {
                    const html = [ white, magenta, blue, green, yellow ].reduce(listReducer, '');
                    el[0].innerHTML = html;
                } else {
                    el[0].innerHTML = [ [ COMPOSER_COLOR ] ].reduce(listReducer, '');
                }

                return (scope, el, { hash, mode }) => {
                    const unsubscribe = [];

                    if (!isEmpty) {
                        const onClick = ({ target }) => {
                            const previous = el[0].querySelector(`.${CLASSNAME_ACTIVE}`);
                            previous && previous.classList.remove(CLASSNAME_ACTIVE);
                            target.classList.add(CLASSNAME_ACTIVE);

                            $rootScope.$emit('colorList', {
                                type: 'add',
                                data: {
                                    hash, mode,
                                    color: target.dataset.color
                                }
                            });
                        };
                        el.on('click', onClick);
                        unsubscribe.push(() => el.off('click', onClick));
                    }

                    if (isEmpty) {
                        const history = [COMPOSER_COLOR];
                        unsubscribe.push($rootScope.$on('colorList', (e, { data }) => {
                            if (data.hash !== hash || data.mode !== mode) {
                                return;
                            }

                            history.unshift(data.color);
                            (history.length > 7) && (history.length = 7);
                            el[0].innerHTML = list(history);
                        }));
                    }

                    scope.$on('$destroy', () => {
                        unsubscribe.forEach((cb) => cb());
                        unsubscribe.length = 0;
                    });
                };
            }
        };
    });
