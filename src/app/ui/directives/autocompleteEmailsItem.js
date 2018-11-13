import { EMAIL_FORMATING } from '../../constants';
import tooltipModel from '../../utils/helpers/tooltipHelper';

const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = EMAIL_FORMATING;

/* @ngInject */
function autocompleteEmailsItem(
    sanitize,
    sendPreferences,
    autoPinPrimaryKeys,
    checkTypoEmails,
    keyCache,
    dispatchers,
    manageContactGroup,
    contactGroupModel
) {
    const KEY_ENTER = 13;

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

    const getAddress = (target) => {
        const { name, adr } = extractAddress(target);
        return { Address: adr || name, Name: sanitize.input(name) };
    };

    const makeIconGroup = ({ Color }) =>
        `<i aria-hidden="true" class="fa fa-users autocompleteEmailsItem-icon-group" style="color:${Color}"></i>`;

    return {
        replace: true,
        templateUrl: require('../../../templates/ui/autoCompleteEmailsItem.tpl.html'),
        link(scope, el, { key }) {
            const { dispatcher, on, unsubscribe } = dispatchers(['recipient.update']);

            const $span = el.find('span');
            const updateBtn = buttonState(el[0]);
            let tooltip;

            if (scope.email.isContactGroup) {
                const group = contactGroupModel.read(scope.email.Address, 'labels');
                el[0].insertAdjacentHTML('afterBegin', makeIconGroup(group));
            }

            const onClick = ({ target }) => {
                if (scope.email.isContactGroup) {
                    return manageContactGroup.editComposer(scope.email.Address, scope.message, key);
                }
                target.setAttribute('contenteditable', !scope.email.isContactGroup);
            };

            const onBlur = ({ target }) => {
                if (scope.email.isContactGroup) {
                    return;
                }

                target.setAttribute('contenteditable', false);

                const { Address: oldAddress } = scope.email;
                const { Address, Name } = getAddress(target);
                updateBtn(Address);

                dispatcher['recipient.update']('update', {
                    Address,
                    Name,
                    oldAddress,
                    messageID: scope.message.ID
                });
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

            /**
             * Add tooltip on the element to display warnings coming from the API
             * The content can change
             */
            const updateTooltip = () => {
                const { warnings = [] } = scope.email; // warnings contains a list of messages

                if (!warnings.length) {
                    tooltip && tooltip.hide();
                    return;
                }

                const title = warnings.join(', ');

                if (!tooltip) {
                    tooltip = tooltipModel(el, { title });
                    return;
                }

                tooltip.updateTitleContent(title);
            };

            on('autocompleteEmails', (e, { type }) => {
                if (type === 'refresh') {
                    updateTooltip();
                }
            });

            on('tooltip', (e, { type }) => {
                if (type === 'hideAll' && tooltip) {
                    tooltip && tooltip.hide();
                }
            });

            $span.on('keydown', onInput);
            $span.on('input', onInput);
            $span.on('click', onClick);
            $span.on('blur', onBlur);

            scope.$on('$destroy', () => {
                $span.off('keydown', onInput);
                $span.off('input', onInput);
                $span.off('click', onClick);
                $span.off('blur', onBlur);
                tooltip && tooltip.dispose();
                unsubscribe();
            });
        }
    };
}
export default autocompleteEmailsItem;
