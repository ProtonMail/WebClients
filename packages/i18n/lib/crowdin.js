const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const JSZip = require('jszip');
const parseCSV = require('csv-parse/lib/sync');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const FormData = require('form-data');
const dedent = require('dedent');

const { spin, success, debug } = require('./helpers/log')('proton-i18n');
const { getFiles, getCrowdin } = require('../config');

const { KEY_API, FILE_NAME, PROJECT_NAME } = getCrowdin();

const { TEMPLATE_NAME, I18N_OUTPUT_DIR, I18N_JSON_DIR, TEMPLATE_FILE_FULL, LANG_EXPORTABLE_LIST } = getFiles();

const getURL = (scope, flag = '') => {
    const customFlag = flag ? `&${flag}` : '';
    return `https://api.crowdin.com/api/project/${PROJECT_NAME}/${scope}?key=${KEY_API}${customFlag}`.trim();
};

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
        'es-ES': 'es',
        'pt-BR': 'pt'
    };
    return map[input] || input;
};

const extractXML = (key) => new RegExp(`(?<=<${key}>)[^<]+`);

/**
 * Check the export status on the API to see its progress
 */
async function checkExport() {
    const { body = '' } = await got(getURL('export-status'));

    // Extract items from the XML response
    const [status] = body.match(extractXML('status'));
    const [progress] = body.match(extractXML('progress'));
    const [build] = body.match(extractXML('last_build'));

    debug(body);
    const date = moment(build).format('DD-MM-YYYY HH:mm');
    console.log(`Last export of translations: ${date}`);
    console.log(`[${status}] ${progress}%`);
}

/**
 * Ask crowdin to create an export
 * This process can be very slow as it's a trigger, so we cancel
 * the request if it takes more than 2s -> it means it's building
 */
async function createExport() {
    const url = getURL('export');
    const request = got(url);

    try {
        // In can take a lot of time
        setTimeout(() => {
            console.log('Cancel request');
            request.cancel();
        }, 2000);
        const { body = '' } = await request;
        debug(body);
        await checkExport();
    } catch (e) {
        if (request.isCanceled) {
            return;
        }
        throw e;
    }
}

/**
 * Download the zip containing all the translations then extract the zip
 * @link https://stuk.github.io/jszip/documentation/howto/read_zip.html
 * @return {JSZip} Instance of JSZip
 */
async function downloadAll() {
    const fileName = 'all.zip';
    const url = getURL(`download/${fileName}`);
    const { body } = await got(url, { encoding: null });
    return JSZip.loadAsync(body);
}

/**
 * Format the filename for a lang inside the ZipFile
 * @param  {String} lang
 * @return {String}
 */
const getFileNameLang = (lang) => {
    const file = path.basename(FILE_NAME, '.pot');
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

    const content = fs.readFileSync(LANG_EXPORTABLE_LIST, 'utf8').toString();
    const list = content.split('\n').filter(Boolean);
    debug(list);
    // Extract only files from our selection list
    const zip = await downloadAll();
    spinner.stop();

    const spinnerZip = spin('Extracting translations');
    const fileList = list.map(async (lang) => {
        const input = path.join(lang, getFileNameLang(lang));
        debug(input);
        const file = await zip.file(input).async('string');
        return { lang, file };
    });
    const files = await Promise.all(fileList);
    spinnerZip.stop();

    // Write them on the project
    files.forEach(({ lang, file }) => {
        const fileName = `${translateLang(lang)}.po`;
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
    const url = getURL('update-file');
    const form = new FormData();
    form.append(`files[/${FILE_NAME}]`, fs.createReadStream(TEMPLATE_FILE_FULL), {
        filename: `@${TEMPLATE_NAME}`
    });
    const { body = '' } = await got.post(url, { body: form });
    spinner.stop();
    debug(body);
    success('Update crowdin with latest template');
}
/**
 * Update latest translations to crowdin
 */
async function listTranslations(spinner, opt = {}) {
    const url = getURL('status', 'json');
    const { body = '' } = await got(url, { json: true });

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
    debug(body);
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
    const getExport = async () => {
        const form = new FormData();
        form.append('format', 'csv');
        const request = got.post(getURL('reports/top-members/export'), { body: form });
        const { body = '' } = await request;
        const [hash] = body.match(extractXML('hash'));
        debug(body);
        return hash;
    };

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

    const hash = await getExport();
    const url = getURL('reports/top-members/download').concat(`&hash=${hash}`);
    debug({ hash, url });
    const { body = '' } = await got(url, { formData: { format: 'csv' } });
    const data = makeOutput(body);

    debug({ format, output: data[format] });
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
            console.log(dedent`
                Usage: $ proton-i18n crowdin <flag>
                Available flags:
                  - ${chalk.blue('--sync|-s')}
                      Update app's translations with the ones from crowdin.
                      You can configure which translations you want to update by using a file i18n.txt.
                      each translations (ex: fr) = one line.
                      More informations on the Wiki

                  - ${chalk.blue('--update|-u')}
                      Update crowdin with our export file from the app

                  - ${chalk.blue('--check|-c')}
                      To check the progress of an export from crowdin (to know if it's done or not yet)

                  - ${chalk.blue('--export|-e')}
                      Ask to crowdin to create an export of translations, as it needs some time to prepare them

                  - ${chalk.blue('--members|-m')}
                      Get from crowdin the list of best contributors for the project
                      Flag: --format=top(default)/full
                            top: list of top 30
                            full: Object with top:List of top 30, byLang:{<lang>:<Array top contributors>}

                  - ${chalk.blue('--list|-l')}
                      List translations available on crowdin sorted by most progress done.
                      Usefull to export translations ex:

                        $ proton-i18n crowdin --list --type
                            only list the code of the translation

                        $ proton-i18n crowdin --list --type --limit=95
                            only list the code of the translation and limit progress >= 95 + approved >= 95

                        $ proton-i18n crowdin --list --type --limit=95 --ignore-approved
                            only list the code of the translation and limit progress >= 95
            `);
        }
        spinner.stop();
    } catch (e) {
        spinner.stop();
        throw e;
    }
}
module.exports = main;
