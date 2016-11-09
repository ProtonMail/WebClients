angular.module('proton.squire')
    .factory('editorModel', () => {

        const MAP = {};

        const load = ({ ID = 'editor' } = {}, editor, iframe) => {
            MAP[ID] = { editor, iframe };
            return editor;
        };
        const find = ({ ID = 'editor' } = {}) => MAP[ID] || {};

        return { load, find };
    });
