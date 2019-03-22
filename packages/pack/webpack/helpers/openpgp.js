const path = require('path');

const transformFile = require('./files');

const getDefineObject = (publicPath, { filepath, integrity }) => {
    return {
        filepath: path.join(publicPath, filepath),
        integrity
    };
};

const transformWorkerContents = (path, contents) =>
    contents.replace('self.window=self,importScripts("openpgp.min.js");', '');

const transformCompatPath = ({ basename, ext, hash }) => [basename, 'compat', hash, ext].join('.');

const transform = (openpgpPaths, openpgpWorkerPath, publicPath, isDistRelease) => {
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
            main: getDefineObject(publicPath, main),
            compat: getDefineObject(publicPath, compat),
            worker: getDefineObject(publicPath, worker)
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
