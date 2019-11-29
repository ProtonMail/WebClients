const path = require('path');

const transformFile = require('./files');

const getDefineObject = ({ filepath, integrity }) => ({ filepath, integrity });

const transformWorkerContents = (path, contents) =>
    contents.replace('self.window=self,importScripts("openpgp.min.js");', '');

const transformCompatPath = ({ basename, ext, hash }) => [basename, 'compat', hash, ext].join('.');

const transform = (openpgpPaths, openpgpWorkerPath, isDistRelease) => {
    const main = transformFile({
        filepath: path.resolve(openpgpPaths[0]),
        hash: isDistRelease
    });

    const compat = transformFile({
        filepath: path.resolve(openpgpPaths[1]),
        hash: isDistRelease,
        transformPath: transformCompatPath
    });

    const worker = transformFile({
        filepath: path.resolve(openpgpWorkerPath),
        hash: isDistRelease,
        transformContents: transformWorkerContents
    });

    const getDefinition = () => {
        return {
            main: getDefineObject(main),
            compat: getDefineObject(compat),
            worker: getDefineObject(worker)
        };
    };

    return {
        main,
        worker,
        compat,
        definition: getDefinition()
    };
};

module.exports = transform;
