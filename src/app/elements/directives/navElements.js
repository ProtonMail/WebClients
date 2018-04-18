import { ROW_MODE } from '../../constants';

/* @ngInject */
function navElements($state, dispatchers, mailSettingsModel, tools) {
    const CLASS_DISPLAY = 'navElements-displayed';
    const CLASS_ERROR = 'navElements-no-';
    const SPECIAL_BOXES = ['drafts', 'search', 'sent', 'allDrafts', 'allSent'];
    const showNextPrev = () => {
        const box = tools.currentMailbox();
        const rowMode = mailSettingsModel.get('ViewLayout') === ROW_MODE;
        const context = tools.cacheContext();
        const notSpecial = SPECIAL_BOXES.indexOf(box) === -1;
        return $state.params.id && rowMode && context && notSpecial;
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/navElements.tpl.html'),
        link(scope, el) {
            const { dispatcher, on, unsubscribe } = dispatchers(['elements']);
            const dispatch = (type, data = {}) => dispatcher.elements(type, data);

            const toggleClass = () => {
                const action = showNextPrev() ? 'add' : 'remove';
                el[0].classList[action](CLASS_DISPLAY);
            };

            const toggleClassError = (name, type) => {
                if (type === 'success') {
                    el[0].classList.remove(CLASS_ERROR + 'previous');
                    el[0].classList.remove(CLASS_ERROR + 'next');
                }
                if (type === 'error') {
                    el[0].classList.add(CLASS_ERROR + name);
                }
            };

            toggleClass();

            on('$stateChangeSuccess', toggleClass);

            on('settings', (event, { type }) => {
                type === 'viewLayout.updated' && toggleClass();
            });

            on('elements', (e, { type }) => {
                if (/(previous|next)\.(error|success)$/.test(type)) {
                    const [, name, flag] = type.split('.');
                    toggleClassError(name, flag);
                }
            });

            const onClick = ({ target }) => {
                dispatch(`switchTo.${target.getAttribute('data-dest')}`, {
                    conversation: scope.conversation,
                    from: 'button'
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default navElements;
