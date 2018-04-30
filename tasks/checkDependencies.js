#!/usr/bin/env node

const { exec } = require('./helpers/command');
const { title, success, error } = require('./helpers/log');
const { externalFiles, vendor_files } = require('../env/conf.build');

const fileExist = (file) => `[ -e ${file} ]`;

const checkDependencies = async (list = [], key) => {
    const col = list.map((file) => {
        return exec(`${fileExist(file)}`)
            .then(() => ({ file }))
            .catch((e) => ({ e, file }));
    });
    const output = await Promise.all(col);
    const errors = output.filter(({ e }) => e).map(({ file }) => file);

    if (errors.length) {
        throw new Error(`[${key}] File not found \n ${errors.join('\n')}`);
    }
    success(`[${key}] All dependencies exist`);
};

(async () => {
    try {
        title(`Check installed dependencies we build`);

        await checkDependencies(externalFiles.openpgp, 'openpgp');
        const list = Object.keys(vendor_files).filter((key) => !/fonts|sass/.test(key));

        for (key of list) {
            await checkDependencies(vendor_files[key], key);
        }
        process.exit(0);
    } catch (e) {
        error(e);
    }
})();
