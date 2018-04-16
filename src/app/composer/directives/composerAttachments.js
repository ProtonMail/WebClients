import _ from 'lodash';
import { CONSTANTS } from '../../constants';

/* @ngInject */
function composerAttachments(gettextCatalog, dispatchers) {
    const CLASS_CLOSED = 'composerAttachments-close';
    const CLASS_HIDDEN = 'composerAttachments-hidden';
    const labelHeader = {
        show: gettextCatalog.getString('Show', null, 'Action'),
        hide: gettextCatalog.getString('Hide', null, 'Action')
    };

    /**
     * Toggle the panel
     * @param  {$scope} scope Current Scope
     * @param  {Node} el
     * @return {Object}       API {close, open, isOpened, toggle}
     */
    const togglePanel = (scope, el) => {
        /**
         * Generate an action function
         * @param  {String} action ClassList method
         * @param  {String} label  Label to display
         * @return {Function}
         */
        const doAction = (action, label) => () => {
            action === 'remove' && el.classList.remove(CLASS_HIDDEN);
            el.classList[action](CLASS_CLOSED);
            scope.$applyAsync(() => (scope.labelHeader = labelHeader[label]));
        };

        const open = doAction('remove', 'hide');
        const close = doAction('add', 'show');
        const show = () => el.classList.remove(CLASS_HIDDEN);
        const hide = () => el.classList.add(CLASS_HIDDEN);
        const isOpened = () => !el.classList.contains(CLASS_CLOSED);

        return {
            open,
            close,
            isOpened,
            hide,
            show,
            toggle() {
                return isOpened() ? close() : open();
            }
        };
    };

    /**
     * Format attachment as packets
     * @param  {$scope} scope
     * @param  {Array}  list  Attachments
     * @return {Array}       Packets
     */
    const formatAttachments = (scope, list = []) => {
        return list.filter(({ Encrypted }) => Encrypted !== CONSTANTS.ENCRYPTED_STATUS.PGP_MIME).map(({ ID, Headers = {}, Name, Size }) => {
            const Inline = +(Headers['content-disposition'] === 'inline');
            return {
                id: ID,
                packet: {
                    filename: Name,
                    uploading: false,
                    Size,
                    Inline
                },
                messageID: scope.message.ID,
                message: scope.message
            };
        });
    };

    const isMessage = ({ ID }, { message = {}, messageID }) => {
        return ID === messageID || ID === message.ID;
    };

    /**
     * We are keeping track of the first upload event by storing the seen requests in the requestSet.
     * This means that it basically contains all the request ids seen as keys
     * (the values are always true, making the object more of a set than a map).
     * The reason this is done, is because the postMessage process is run at the same time as the composer.
     * In postMessage we upload PGP attachments as normal ProtonMail attachments.
     * But the composer is not necessarily initialized yet at that point, so it misses the first start event.
     *
     * Custom action for the event attachment.upload
     * @param  {$scope} scope
     * @param  {Object} actionsPanel  Manager for the panel
     * @return {Function}             Callback event
     */
    const onAction = (scope, el, actionsPanel, requestSet) => (e, { type, data }) => {
        const { status, packet, id, messageID, REQUEST_ID } = data;

        if (!isMessage(scope.message, data)) {
            return;
        }

        switch (type) {
            // After an action triggered by askEmbedded
            case 'upload':
                if (data.action !== 'cancel') {
                    return;
                }

                if (scope.message.Attachments.length) {
                    return actionsPanel.close();
                }

                actionsPanel.hide();
                break;
            case 'cancel':
            case 'remove.success':
                scope.$applyAsync(() => {
                    scope.list = scope.list
                        .filter((o) => o.id !== id) // Click from editor button
                        .filter((o) => o.id !== REQUEST_ID); // Remove with SUPPR from editor
                    !scope.list.length && actionsPanel.hide();
                });
                break;

            case 'uploading':
                // isStart is not used as PGP uploads can start before the composer is loaded but finish after
                // the composer is loaded.
                if (status && !_.has(requestSet, id)) {
                    actionsPanel.open();
                    requestSet[id] = true;
                    scope.$applyAsync(() => {
                        scope.list.push({ id, packet, messageID, message: scope.message });
                    });
                }
                break;

            case 'error':
                scope.$applyAsync(() => {
                    scope.list = scope.list.filter((item) => item.id !== id);
                    actionsPanel.close();
                    !scope.list.length && actionsPanel.hide();
                });
                break;

            case 'upload.success':
                if (status && !_.has(requestSet, id)) {
                    requestSet[id] = true;
                    scope.$applyAsync(() => {
                        scope.list.push({ id, packet, messageID, message: scope.message });
                    });
                }
                actionsPanel.close();
                break;
        }
    };

    return {
        replace: true,
        scope: {
            message: '=model'
        },
        templateUrl: require('../../../templates/directives/composer/composerAttachments.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            scope.list = formatAttachments(scope, scope.message.Attachments);
            scope.labelHeader = labelHeader.show;

            const requestSet = {};

            const actionsPanel = togglePanel(scope, el[0]);
            const $header = angular.element(el[0].querySelector('.composerAttachments-header'));

            !scope.list.length && actionsPanel.hide();

            const onClick = () => actionsPanel.toggle();
            $header.on('click', onClick);

            on('attachment.upload', onAction(scope, el, actionsPanel, requestSet));

            scope.$on('$destroy', () => {
                $header.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default composerAttachments;
