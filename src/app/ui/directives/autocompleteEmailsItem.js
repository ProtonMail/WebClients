import { EMAIL_FORMATING } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = EMAIL_FORMATING;

/* @ngInject */
function autocompleteEmailsItem(sanitize, sendPreferences, autoPinPrimaryKeys, checkTypoEmails, keyCache, dispatchers) {
    const KEY_ENTER = 13;
    const { dispatcher } = dispatchers(['recipient.update']);

    /**
     * Change button [data-address] to delete the item
     * because we need it to match the address  inside the list
     * @param  {Node} node Component
     * @return {Function}     (address:String)
     */
    const buttonState = (node) => {
        const btn = node.querySelector('button');
        return (address) => btn.setAttribute('data-address', address);
    };

    /**
     * Extact and clean the new email
     * Format:
     *     - XXXX <xxx@xxxx.xxx>
     *     - xxx@xxxx.xxx
     * @param  {Node} target
     * @return {Object}        { name: String, adr:String }
     */
    const extractAddress = (target) => {
        const [name = '', adr = ''] = target.textContent
            .replace(CLOSE_TAG_AUTOCOMPLETE_RAW, '')
            .split(OPEN_TAG_AUTOCOMPLETE_RAW);
        return { name: name.trim(), adr: adr.trim() };
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/ui/autoCompleteEmailsItem.tpl.html'),
        link(scope, el) {
            const $span = el.find('span');
            const updateBtn = buttonState(el[0]);

            const onClick = ({ target }) => target.setAttribute('contenteditable', true);

            const onBlur = ({ target }) => {
                target.setAttribute('contenteditable', false);

                const getAddress = (target) => {
                    const { name, adr } = extractAddress(target);
                    return { Address: adr || name, Name: sanitize.input(name) };
                };

                const { Address: oldAddress } = scope.email;
                const { Address, Name } = getAddress(target);
                updateBtn(Address);

                dispatcher['recipient.update']('update', { messageID: scope.message.ID, oldAddress, Address, Name });
            };

            /*
                Prevent event propagation for custom action by the main component.
                And reset invalid state
                ex: BACKSPACE
             */
            const onInput = (e) => {
                if (e.keyCode === KEY_ENTER) {
                    return onBlur(e);
                }

                if (e.target.getAttribute('contenteditable') === 'true') {
                    e.stopPropagation();
                    scope.email.invalid && scope.$applyAsync(() => (scope.email.invalid = false));
                }
            };

            $span.on('keydown', onInput);
            $span.on('input', onInput);
            $span.on('click', onClick);
            $span.on('blur', onBlur);

            scope.$on('$destroy', () => {
                $span.off('keydown', onInput);
                $span.off('input', onInput);
                $span.off('click', onClick);
                $span.off('blur', onBlur);
            });
        }
    };
}
export default autocompleteEmailsItem;
