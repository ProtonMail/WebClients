import { generateUID } from '../../../helpers/string';

/* @ngInject */
function dropdownContainer(dispatchers) {
    const CLASSNAMES = {
        left: 'dropDown--leftArrow',
        right: 'dropDown--rightArrow'
    };

    function link(scope, el, { position }) {
        const id = generateUID();

        position && el[0].classList.add(CLASSNAMES[position]);
        el[0].setAttribute('data-dropdown-id', id);

        const { dispatcher, on, unsubscribe } = dispatchers(['dropdownApp']);

        scope.$applyAsync(() => {
            let isLocked = false;
            const $btn = el[0].querySelector('.dropdownButton-container');
            const $content = el[0].querySelector('.dropdownContent-container');

            const toggle = (isOpen) => {
                $btn.setAttribute('aria-expanded', !isOpen);
                isOpen && $content.setAttribute('hidden', isOpen);
                !isOpen && $content.removeAttribute('hidden');
                dispatcher.dropdownApp('state', { isOpened: !isOpen, id });
            };

            function attachListener(remove) {
                if (remove) {
                    document.body.removeEventListener('click', onClick, false);
                    document.body.removeEventListener('keydown', onKeydown, false);
                    return;
                }

                document.body.addEventListener('click', onClick, false);
                document.body.addEventListener('keydown', onKeydown, false);
            }

            function onClick({ target }) {
                if (target !== el[0] && !el[0].contains(target) && !isLocked) {
                    toggle(true);
                    attachListener(true);
                }
            }

            function onKeydown({ code }) {
                if (code === 'Escape' && el[0].contains(document.activeElement)) {
                    toggle(true);
                    attachListener(true);
                }
            }

            const onClickButton = ({ target }) => {
                const isOpen = JSON.parse(target.getAttribute('aria-expanded') || false);
                toggle(isOpen);
                !isOpen && _rAF(() => attachListener(false));
                isOpen && _rAF(() => attachListener(true));
            };

            $btn.addEventListener('click', onClickButton);

            on('dropdownApp', (e, { type, data = {} }) => {
                if (data.id !== id) {
                    return;
                }

                if (type === 'action') {
                    toggle(data.type === 'close');
                }

                if (type === 'lock') {
                    isLocked = data.value;
                }
            });

            scope.$on('$destroy', () => {
                attachListener(true);
                $btn.removeEventListener('click', onClickButton);
                unsubscribe();
            });
        });
    }

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        transclude: true,
        templateUrl: require('../../../templates/ui/dropdownContainer.tpl.html'),
        link
    };
}
export default dropdownContainer;
