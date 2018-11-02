const fs = require('fs');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');

const { error } = require('./helpers/log');
const { externalFiles, vendor_files } = require('../env/conf.build');

const checkDependencies = async (paths = [], key) => {
    const missingPaths = paths.filter((path) => !fs.existsSync(path));
    if (missingPaths.length) {
        throw new Error(`[${key}] File not found \n ${missingPaths.join('\n')}`);
    }
};

const list = Object.keys(vendor_files).filter((key) => !/fonts|sass/.test(key));

const taskList = list.reduce(
    (acc, key) => {
        acc.push({
            title: `Verify dependencies for: ${key}`,
            task() {
                return checkDependencies(vendor_files[key], key);
            }
        });
        return acc;
    },
    [
        {
            title: 'Verify dependencies for: openpgp',
            task() {
                return checkDependencies(externalFiles.openpgp, 'openpgp');
            }
        }
    ]
);

const tasks = new Listr(taskList, {
    renderer: UpdaterRenderer,
    collapse: false,
    concurent: true
});
tasks.run().catch(error);
