angular.module('proton.squire')
    .directive('squireToolbar', ($rootScope, CONSTANTS) => {

        const CONTAINER_CLASS = 'squireToolbar-container squire-toolbar';
        const HEADER_CLASS = CONSTANTS.DEFAULT_SQUIRE_VALUE.HEADER_CLASS;

        /**
         * Listener to detect the current style of a selected element
         * @param  {Squire} options.editor
         * @param  {Node} node           Current toolbar
         * @return {void}
         */
        const onAction = ({ editor }, node) => {
            const onPathChange = _.debounce(() => {
                const p = editor.getPath();

                if (p !== '(selection)') {

                    /**
                     * Find and filter selections to toogle the current action (toolbar)
                     * Ex: isBold etc.
                     */
                    const classNames = _
                        .chain(p.split('>'))
                        .filter((i) => i && !/IMG.proton-embedded|.proton-embedded|DIV.image.loading/i.test(i))
                        .reduce((acc, path) => acc.concat(path.split('.')), [])
                        .filter((i) => i && !/div|html|body|span/i.test(i))
                        .reduce((acc, key) => {
                            if (HEADER_CLASS === key) {
                                return `${acc} size`;
                            }
                            return `${acc} ${key.trim()}`;
                        }, '')
                        .value()
                        .toLowerCase()
                        .trim();

                    node.className = `${CONTAINER_CLASS} ${classNames}`;
                }

            }, 100);

            editor.addEventListener('pathChange', onPathChange);

            return () => editor.removeEventListener('pathChange', onPathChange);
        };

        /**
         * Check if this is the current instance of the editor
         * @param  {Message} options.message Current message
         * @param  {String} options.ID      ID of the message loaded
         * @return {Boolean}
         */
        const isCurrent = ({ message = {} }, { ID = 'editor' } = {}) => {
            const currentID = message.ID || 'editor';
            return ID === currentID;
        };

        const onCurrentMessage = (scope, cb) => (e, { type, data }) => {
            isCurrent(scope, data.message) && cb(type, data);
        };

        return {
            replace: true,
            templateUrl: 'templates/squire/squireToolbar.tpl.html',
            link(scope, el) {

                let unsubscribeActions = angular.noop;
                const onActions = (type, data) => {
                    if (type === 'loaded') {
                        unsubscribeActions = onAction(data, el[0]);
                    }
                };

                const unsubscribe = $rootScope.$on('squire.editor', onCurrentMessage(scope, onActions));

                scope.$on('$destroy', () => {
                    unsubscribeActions();
                    unsubscribe();
                });

            }
        };
    });
