import { LINK_TYPES } from '../../constants';
import { setHidden } from '../../../helpers/domHelper';
import { formatLink } from '../../../helpers/urlHelpers';

/* @ngInject */
function addLink(gettextCatalog, translator) {
    const I18N = translator(() => ({
        description: {
            [LINK_TYPES.WEB]: gettextCatalog.getString('To what URL should this link go?', null, 'Composer, add Link'),
            [LINK_TYPES.EMAIL]: gettextCatalog.getString(
                'To what email address should this link?',
                null,
                'Composer, add Link'
            ),
            [LINK_TYPES.PHONE]: gettextCatalog.getString(
                'To what phone number should this link?',
                null,
                'Composer, add Link'
            )
        },
        placeholder: {
            [LINK_TYPES.WEB]: gettextCatalog.getString('Add a web address', null, 'Composer, add Link'),
            [LINK_TYPES.EMAIL]: gettextCatalog.getString('Add an email address', null, 'Composer, add Link'),
            [LINK_TYPES.PHONE]: gettextCatalog.getString('Add a phone number', null, 'Composer, add Link')
        }
    }));

    return {
        replace: true,
        scope: {
            form: '=',
            link: '='
        },
        restrict: 'E',
        templateUrl: require('../../../templates/squire/addLink.tpl.html'),
        link(scope, $el) {
            const el = $el[0];

            /**
             * Keep state regarding inputs. Not using angular's $dirty to avoid having to scope.applyAsync everywhere.
             * If the label is already prefilled, set it to dirty.
             * @type {{linkLabelDirty: boolean}}
             */
            const state = {
                linkLabelDirty: scope.link.label !== ''
            };

            // Bind the link types to scope so it can be used in the template.
            scope.linkTypes = LINK_TYPES;

            const urlLinkDescription = el.querySelector('.addLink-urlLinkDescription');
            const urlLinkInput = el.querySelector('.addLink-urlLinkInput');
            const labelLinkInput = el.querySelector('.addLink-labelLinkInput');
            const linkTest = el.querySelector('.addLink-linkTest');
            const linkTypes = el.querySelector('.addLink-linkTypes');

            /**
             * Update the label value in the ng-model.
             * @param {String} value
             */
            const prefillLabel = (value) => {
                scope.$applyAsync(() => {
                    scope.link.label = value;
                });
            };

            /**
             * Set a new link url. Hide or update the "test link". Prefill the label.
             * @param {String} value URL value
             * @param {String} type Link type
             */
            const onUrlChange = (value = '', type = LINK_TYPES.WEB) => {
                // If the label link has no value, or it has not been edited by the user, automatically set the label value to the link.
                if (scope.link.label === '' || !state.linkLabelDirty) {
                    prefillLabel(value);
                }
                // If the type is not web, we can already hide the "test link".
                if (type !== LINK_TYPES.WEB) {
                    setHidden(linkTest, true);
                    return;
                }
                // Set the "test link" to be visible or hidden, and update the href.
                setHidden(linkTest, value.length === 0);
                const href = formatLink(value, type);
                if (!href) {
                    return linkTest.removeAttribute('href');
                }
                linkTest.setAttribute('href', href);
            };

            /**
             * Set a new link type and update the placeholder and textcontent.
             * @param {String} type Link type
             */
            const onLinkTypeChange = (type = LINK_TYPES.WEB) => {
                urlLinkDescription.textContent = I18N.description[type];
                urlLinkInput.placeholder = I18N.placeholder[type];
                onUrlChange(scope.link.url, type);
            };

            /**
             * Input change for the url link input.
             * @param {DOMEvent} e
             */
            const onValueChange = (e) => {
                onUrlChange(e.target.value, scope.link.type);
            };

            /**
             * Radio input change listener for the link type. Update the url in the ng-model.
             * @param {DOMEvent} event
             */
            const onRadioChange = ({ target }) => {
                scope.$applyAsync(() => {
                    scope.link.url = '';
                    onLinkTypeChange(target.value);
                });
            };

            /**
             * When the label has changed value, set the dirty flag on the input.
             * @param {DOMEvent} event
             */
            const onLabelValueChange = ({ target }) => {
                state.linkLabelDirty = target.value !== '';
            };

            onLinkTypeChange(scope.link.type);

            urlLinkInput.focus();

            linkTypes.addEventListener('change', onRadioChange);
            urlLinkInput.addEventListener('input', onValueChange);
            urlLinkInput.addEventListener('change', onValueChange);
            labelLinkInput.addEventListener('input', onLabelValueChange);

            scope.$on('$destroy', () => {
                linkTypes.removeEventListener('change', onRadioChange);
                urlLinkInput.removeEventListener('input', onValueChange);
                urlLinkInput.removeEventListener('change', onValueChange);
                labelLinkInput.removeEventListener('input', onLabelValueChange);
            });
        }
    };
}

export default addLink;
