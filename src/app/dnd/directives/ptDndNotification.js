angular.module('proton.dnd')
    .factory('ptDndNotification', (PTDNDCONSTANTS, gettextCatalog, $rootScope, aboutClient) => {

        const { CLASSNAME } = PTDNDCONSTANTS;

        /**
         * Translate notification based on the quantity and the type of item
         * @param  {Number} total How many item ?
         * @param  {String} item  Type of dnd item
         * @return {String}
         */
        const getMessage = (total, item) => {
            const message = gettextCatalog.getPlural(total, 'message', 'messages');
            const conversation = gettextCatalog.getPlural(total, 'conversation', 'conversations');
            return gettextCatalog.getString('Move {{total}} {{type}}', {
                type: (item === 'conversation') ? conversation : message,
                total
            }, 'notification drag and drop');
        };

        const isIE11 = aboutClient.isIE11();
        const isEdge = aboutClient.isEdge();
        const isFirefox = aboutClient.isFirefox();
        const suffix = isEdge ? '!important' : '';

        const makeNotification = () => {
            const $notif = document.createElement('SPAN');
            $notif.className = CLASSNAME.NOTIF;
            document.body.appendChild($notif);
            return $notif;
        };

        const $notif = makeNotification();
        isFirefox && $notif.classList.add(CLASSNAME.NOTIF_FIREFOX);

        const show = (node = $notif) => node.classList.add(CLASSNAME.NOTIF_ACTIVE);
        const hide = () => $notif.classList.remove(CLASSNAME.NOTIF_ACTIVE);

        // It doesn't work with Firefox but we can use setDragImage... lol
        !isFirefox && document.addEventListener('drag', (e) => {
            _rAF(() => {
                $notif.style.transform = `translate(${e.clientX}px, ${e.clientY}px) ${suffix}`.trim();
            });
        });

        document.addEventListener('dragend', () => {
            hide();
        });

        const onDragStart = (e, eventData, type) => {

            $notif.textContent = getMessage($rootScope.numberElementChecked || 1, type);

            if (!isIE11 && !isEdge && !isFirefox) {
                const img = new Image();
                // We need to add a space.gif for Safari else no dnd :troll:
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                eventData.setDragImage(img, 0, 0);
            }

            // Only one where this works... a span as an image ヘ（。□°）ヘ
            if (isFirefox) {
                eventData.setDragImage($notif, 0, 0);
            }

            (!isIE11 && !isEdge) && show();
        };

        return { init: angular.noop, show, hide, onDragStart };
    });
