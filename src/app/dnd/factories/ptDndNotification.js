import { isIE11, isEdge, isFirefox } from '../../../helpers/browser';

/* @ngInject */
function ptDndNotification(AppModel, PTDNDCONSTANTS, gettextCatalog) {
    const { CLASSNAME } = PTDNDCONSTANTS;

    /**
     * Translate notification based on the quantity and the type of item
     * @param  {Number} total How many item ?
     * @param  {String} item  Type of dnd item
     * @return {String}
     */
    const getMessage = (total, item) => {
        const message = gettextCatalog.getPlural(total, 'message', 'messages', {}, 'Type of item');
        const conversation = gettextCatalog.getPlural(total, 'conversation', 'conversations', {}, 'Type of item');
        const contact = gettextCatalog.getPlural(total, 'contact', 'contacts', {}, 'Type of item');

        const getType = (type) => {
            if (type === 'contact') {
                return contact;
            }
            return type === 'conversation' ? conversation : message;
        };

        return gettextCatalog.getString(
            'Move {{total}} {{type}}',
            {
                type: getType(item),
                total
            },
            'notification drag and drop'
        );
    };

    const testIE11 = isIE11();
    const testEdge = isEdge();
    const testFirefox = isFirefox();
    const suffix = testEdge ? '!important' : '';

    const makeNotification = () => {
        const $notif = document.createElement('SPAN');
        $notif.className = CLASSNAME.NOTIF;
        document.body.appendChild($notif);
        return $notif;
    };

    const $notif = makeNotification();
    testFirefox && $notif.classList.add(CLASSNAME.NOTIF_FIREFOX);

    const show = (node = $notif) => node.classList.add(CLASSNAME.NOTIF_ACTIVE);
    const hide = () => $notif.classList.remove(CLASSNAME.NOTIF_ACTIVE);

    // It doesn't work with Firefox but we can use setDragImage... lol
    !testFirefox &&
        document.addEventListener('drag', (e) => {
            _rAF(() => {
                $notif.style.transform = `translate(${e.clientX}px, ${e.clientY}px) ${suffix}`.trim();
            });
        });

    document.addEventListener('dragend', () => {
        hide();
    });

    const onDragStart = (e, eventData, type) => {
        $notif.textContent = getMessage(AppModel.get('numberElementChecked') || 1, type);

        if (!testIE11 && !testEdge && !testFirefox) {
            const img = new Image();
            // We need to add a space.gif for Safari else no dnd :troll:
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            eventData.setDragImage(img, 0, 0);
        }

        // Only one where this works... a span as an image ヘ（。□°）ヘ
        if (testFirefox) {
            eventData.setDragImage($notif, 0, 0);
        }

        !testIE11 && !testEdge && show();
    };

    return { init: angular.noop, show, hide, onDragStart };
}
export default ptDndNotification;
