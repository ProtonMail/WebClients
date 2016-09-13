angular.module('proton.composer')
  .factory('dropzoneModel', () => {

    let MAP = {};

    const put = ({ ID } = {}, dropzone = {}) => {
        // Clean the dropzone if it was already there
        if (MAP[ID]) {
            MAP[ID].off('dragover');
            MAP[ID] = null;
        }
        return (MAP[ID] = dropzone);
    };
    const get = ({ ID } = {}) => MAP[ID];
    const remove = ({ ID } = {}) => {
        MAP[ID].off('dragover');
        delete MAP[ID];
    };

    return { put, get, remove };
  });
