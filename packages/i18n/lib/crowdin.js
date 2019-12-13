const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');
const JSZip = require('jszip');
const parseCSV = require('csv-parse/lib/sync');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const renderHelp = require('./helpers/help');
const coucou = require('./helpers/coucou');
const apiCrowdin = require('./helpers/apiCrowdin');

const { spin, success, debug, warn } = require('./helpers/log')('proton-i18n');
const { getFiles, getCrowdin } = require('../config');

const { FILE_NAME } = getCrowdin();
const { I18N_OUTPUT_DIR, I18N_JSON_DIR, LANG_EXPORTABLE_LIST } = getFiles();

/**
 * Format the lang output as we have some custom case because we don't
 * use the same format as sometimes ex: uk it's not standard
 * @param  {String} input lang
 * @return {String}
 */
const translateLang = (input) => {
    const map = {
        uk: 'ua',
        'es-ES': 'es',
        'pt-BR': 'pt'
    };
    return map[input] || input;
};

/**
 * Check the export status on the API to see its progress
 */
async function checkExport(spinner) {
    const { last_build: build, status, progress } = await apiCrowdin.checkStatusExport();
    spinner && spinner.stop();
    const date = moment(build).format('DD-MM-YYYY HH:mm');
    success(`Last export of translations: ${date} - status:${status} ${progress}%`);
}

/**
 * Ask crowdin to create an export
 * This process can be very slow as it's a trigger, so we cancel
 * the request if it takes more than 5s -> it means it's building
 */
function createExport() {
    return apiCrowdin.createExport();
}

/**
 * Download the zip containing all the translations then extract the zip
 * @link https://stuk.github.io/jszip/documentation/howto/read_zip.html
 * @return {JSZip} Instance of JSZip
 */
async function downloadAll() {
    const data = await apiCrowdin.download();
    return JSZip.loadAsync(data);
}

/**
 * Format the filename for a lang inside the ZipFile
 * @param  {String} lang
 * @return {String}
 */
const getFileNameLang = (lang) => {
    const file = path.basename(FILE_NAME, '.pot');
    if (/\.json$/.test(file)) {
        return file;
    }
    return `${file}-${lang}.po`;
};

/**
 * Download latest translations exported on the API, extract them
 * and update our selection specified inside the i18n.txt file.
 */
async function fetchThemAll(spinner) {
    debug(LANG_EXPORTABLE_LIST);
    if (!fs.existsSync(LANG_EXPORTABLE_LIST)) {
        throw new Error(`You must create a file ${LANG_EXPORTABLE_LIST}. More informations on the wiki`);
    }

    const isJSON = /\.json$/.test(FILE_NAME);
    const content = fs.readFileSync(LANG_EXPORTABLE_LIST, 'utf8').toString();
    const list = content.split('\n').filter(Boolean);
    debug(list, 'List translations');
    // Extract only files from our selection list
    const zip = await downloadAll();
    spinner.stop();

    const spinnerZip = spin('Extracting translations');
    const fileList = list.map(async (lang) => {
        const input = path.join(lang, getFileNameLang(lang));
        debug(input, 'input file');
        try {
            const file = await zip.file(input).async('string');
            return { lang, file, isJSON };
        } catch (e) {
            warn(`Translation for ${lang} not available.\n${e.message}`);
        }
    });
    const files = await Promise.all(fileList);
    spinnerZip.stop();

    // Write them on the project
    files.filter(Boolean).forEach(({ lang, file, isJSON }) => {
        const ext = isJSON ? 'json' : 'po';
        const fileName = `${translateLang(lang)}.${ext}`;
        const output = path.join(I18N_OUTPUT_DIR, fileName);
        debug(`[${lang}] Write: ${output}`);
        fs.writeFileSync(output, file);
        success(`[${lang}] Import new translation`);
    });
}

/**
 * Update latest translations to crowdin
 */
async function udpate(spinner) {
    const { success: isSuccess, type } = await apiCrowdin.upload();
    spinner.stop();

    if (isSuccess && type === 'update') {
        success('Update crowdin with latest template');
    }

    if (isSuccess && type === 'create') {
        success('Create new template on crowdin');
    }

    coucou.send(type); // Inform us about the change 📢
}

/**
 * Update latest translations to crowdin
 */
async function listTranslations(spinner, opt = {}) {
    const body = await apiCrowdin.getStatus();

    /**
     * Format output of the function when we list translations
     */
    const format = ({ name, code, translated_progress: progress, approved_progress: approved }) => {
        if (argv.type || argv.t || opt.type) {
            return [code];
        }
        return ['-', chalk.cyan(code), name, `progress: ${progress}%`, `approved: ${approved}%`];
    };

    /**
     * Filter output if we want to extract a portion of translations
     * Based on the limit flag
     */
    const limit = (item) => {
        if (!argv.limit && !opt.limit) {
            return true;
        }
        const limit = argv.limit || opt.limit;
        const approved = argv['ignore-approved'] ? true : item.approved_progress >= limit;
        return item.translated_progress >= limit && approved;
    };

    spinner.stop();
    const list = _.sortBy(body, ['translated_progress', 'approved_progress'])
        .reverse()
        .filter(limit)
        .map(format);

    if (opt.outputLang) {
        const output = list.toString().replace(/,/g, '\n');
        debug(output);
        fs.writeFileSync(LANG_EXPORTABLE_LIST, output);
        return success('Get list of translations available');
    }

    list.forEach((item) => {
        console.log(...item);
    });
}

async function listMembers(spinner, format = 'top') {
    const body = await apiCrowdin.getTopMember();

    if (!body) {
        return;
    }
    const makeOutput = (body) => {
        const list = parseCSV(body, {
            columns: true,
            skip_empty_lines: true
        });

        const toProfile = (input = '') => {
            const [name, value = ''] = input.split(' (');
            const pseudo = !value ? name : value.replace(/\)$/, '');
            const url = `https://crowdin.com/profile/${pseudo}`;
            return { name, url };
        };

        const top = list.slice(0, 29).map(({ Name }) => toProfile(Name));
        const byLang = list.reduce((acc, item) => {
            const { Languages = '' } = item;
            Languages.split('; ').forEach((lang) => {
                lang && !acc[lang] && (acc[lang] = []);
                lang && acc[lang].push(toProfile(item.Name));
            });
            return acc;
        }, Object.create(null));
        return {
            full: { byLang, top },
            top
        };
    };

    const data = makeOutput(body);

    debug({ format, output: data[format], outputFile: path.join(I18N_JSON_DIR, 'topMembers.json') });
    spinner.stop();
    fs.writeFileSync(path.join(I18N_JSON_DIR, 'topMembers.json'), JSON.stringify(data[format]));
    success('Export top members');
}

async function main(opt = {}) {
    const getSpinnerMessage = () => {
        if (argv.c || argv.check) {
            return 'Cheking the status of the current export';
        }

        if (argv.s || argv.sync) {
            return 'Downloading all translations';
        }

        if (argv.u || argv.update) {
            return 'Uploading new translations';
        }

        if (argv.l || argv.list) {
            return 'Loading the list of translations';
        }
        if (argv.m || argv.members) {
            return 'Loading the list of members';
        }
    };

    const msg = getSpinnerMessage();
    const spinner = msg ? spin(msg) : { stop() {} };

    try {
        if (argv.c || argv.check) {
            await checkExport(spinner);
        }

        if (argv.s || argv.sync || opt.sync) {
            await fetchThemAll(spinner);
        }

        if (argv.e || argv.export) {
            await createExport();
        }

        if (argv.u || argv.update) {
            await udpate(spinner);
        }

        if (argv.l || argv.list || opt.list) {
            await listTranslations(spinner, opt);
        }
        if (argv.m || argv.members) {
            await listMembers(spinner, argv.format);
        }

        if (argv.help) {
            spinner.stop();
            renderHelp('help-crowdin');
        }

        spinner.stop();
    } catch (e) {
        spinner.stop();
        throw e;
    }
}
module.exports = main;
