angular.module('proton.squire')
    .directive('squireSelectFontFamily', (squireDropdown, editorModel, onCurrentMessage) => {

        const ACTION = 'setFontFace';
        const MAP = {
            georgia: 'Georgia',
            arial: 'Arial',
            verdana: 'Verdana',
            tahoma: 'Tahoma',
            'trebuchet ms': 'Trebuchet MS',
            helvetica: 'Helvetica',
            'times new roman': 'Times New Roman',
            menlo: 'Monospace',
            consolas: 'Monospace',
            'courier new': 'Monospace',
            monospace: 'Monospace'
        };
        const KEYS = Object.keys(MAP);

        const getFont = (font) => {
            const key = _.find(KEYS, (key) => new RegExp(key).test(font));
            return MAP[key];
        };

        return {
            replace: true,
            templateUrl: 'templates/squire/squireSelectFontFamily.tpl.html',
            link(scope, el) {

                const container = squireDropdown(scope.message);
                const dropdown = container.create(el[0], ACTION);
                const { editor } = editorModel.find(scope.message);

                container.attach(ACTION, {
                    node: el[0],
                    attribute: 'data-font-family'
                });

                const parseContent = () => {
                    const { family = 'arial' } = editor.getFontInfo() || {};
                    const font = family.replace(/"/g, '');
                    dropdown.refresh(getFont(font), font);
                    return font;
                };

                const onClick = () => dropdown.toggle(parseContent);
                const onActions = (type, data) => {
                    (data.action === ACTION) && parseContent();
                };

                el.on('click', onClick);
                editor.addEventListener('click', parseContent);
                const unsubscribe = onCurrentMessage('squire.editor', scope, onActions);

                scope.$on('$destroy', () => {
                    editor.removeEventListener('click', parseContent);
                    el.off('click', onClick);
                    unsubscribe();
                    dropdown.unsubscribe();
                });
            }
        };
    });
