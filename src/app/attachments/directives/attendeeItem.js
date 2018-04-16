/* @ngInject */
function attendeeItem() {

    /**
     * Create an anchor element
     * @param {String} attendee Email address with the mailto prefix (mailto:a@b.com)
     * @return {Element} Anchor element
     */
    const buildAnchor = (attendee) => {
        // Remove the `mailto:` prefix
        const address = attendee.substr(7);
        const paramIndex = address.indexOf('?');
        // Remove possible params
        const addressOnly = paramIndex < 0 ? address : address.substr(0, paramIndex);
        const anchor = document.createElement('a');
        anchor.href = attendee;
        anchor.textContent = addressOnly;
        anchor.classList.add('attendeeItem-mailto-link');
        return anchor;
    };

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/attachments/attendeeItem.tpl.html'),
        link(scope, el, { attendee = '' }) {
            const isMailto = attendee.toLowerCase().startsWith('mailto:');

            if (isMailto) {
                el[0].appendChild(buildAnchor(attendee));
                return;
            }

            el[0].textContent = attendee;
        }
    };
}
export default attendeeItem;
