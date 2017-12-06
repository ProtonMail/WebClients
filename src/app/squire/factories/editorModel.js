/* @ngInject */
function editorModel() {
    const MAP = {};

    const load = ({ ID = 'editor' } = {}, editor, iframe) => {
        MAP[ID] = { editor, iframe };
        return editor;
    };
    const find = ({ ID = 'editor' } = {}) => MAP[ID] || {};
    const remove = ({ ID = 'editor' } = {}) => delete MAP[ID];

    return { load, find, remove };
}
export default editorModel;
