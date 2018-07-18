#!/usr/bin/env node

const execa = require('execa');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');

const { error } = require('./helpers/log');
const { externalFiles, vendor_files } = require('../env/conf.build');

const fileExist = (file) => `[ -e ${file} ]`;

const checkDependencies = async (list = [], key) => {
    const col = list.map((file) => {
        return execa
            .shell(`${fileExist(file)}`, { shell: '/bin/bash' })
            .then(() => ({ file }))
            .catch((e) => ({ e, file }));
    });
    const output = await Promise.all(col);
    const errors = output.filter(({ e }) => e).map(({ file }) => file);

    if (errors.length) {
        throw new Error(`[${key}] File not found \n ${errors.join('\n')}`);
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
