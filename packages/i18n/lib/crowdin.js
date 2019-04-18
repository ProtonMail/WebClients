const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const got = require('got');
const chalk = require('chalk');
const JSZip = require('jszip');
const moment = require('moment');
const argv = require('minimist')(process.argv.slice(2));
const FormData = require('form-data');
const dedent = require('dedent');

require('dotenv').config({ path: 'env/.env' });

const { error, json, spin, success, debug } = require('./helpers/log')('proton-i18n');

const DEST_FILE = process.env.DEST_FILE;
const PROJECT_NAME = process.env.PROJECT_NAME;
const TEMPLATE_FILE = 'template.pot';
const OUTPUT_I18N_DIR = path.join(process.cwd(), 'po');
const TEMPLATE_FILE_PATH = path.join(OUTPUT_I18N_DIR, TEMPLATE_FILE);


if (!process.env.CROWDIN_KEY_API || !process.env.DEST_FILE || !process.env.PROJECT_NAME) {
    const keys = ['CROWDIN_KEY_API', 'DEST_FILE', 'PROJECT_NAME'].join(' - ');
    error(new Error(`Missing one/many mandatory keys from the .env ( cf the Wiki): \n${keys}`));
}

const getURL = (scope, flag = '') => {
    const customFlag = flag ? `&${flag}` : '';
    return `https://api.crowdin.com/api/project/${PROJECT_NAME}/${scope}?key=${
        process.env.CROWDIN_KEY_API
    }${customFlag}`.trim();
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
    debug(body);
    return JSZip.loadAsync(body);
}

/**
 * Download latest translations exported on the API, extract them
 * and update our selection specified inside the i18n.txt file.
 */
async function fetchThemAll(spinner) {
    if (!fs.existsSync('env/i18n.txt')) {
        throw new Error('You must create a file env/i18n.txt. More informations on the wiki');
    }

    const content = fs.readFileSync('env/i18n.txt', 'utf8').toString();
    const list = content.split('\n').filter(Boolean);
    debug(list);
    // Extract only files from our selection list
    const zip = await downloadAll();
    spinner.stop();

    const spinnerZip = spin('Extracting translations');
    const fileList = list.map(async (lang) => {
        const input = path.join(lang, `ProtonMail Web Application-${lang}.po`);
        const file = await zip.file(input).async('string');
        return { lang, file };
    });
    const files = await Promise.all(fileList);
    spinnerZip.stop();

    // Write them on the project
    files.forEach(({ lang, file }) => {
        const fileName = `${translateLang(lang)}.po`;
        const output = path.join(OUTPUT_I18N_DIR, fileName);
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
    form.append(`files[/${DEST_FILE}]`, fs.createReadStream(TEMPLATE_FILE_PATH), {
        filename: `@${TEMPLATE_FILE}`
    });
    const { body = '' } = await got.post(url, { body: form });
    spinner.stop();
    debug(body);
    success('Update crowdin with latest template');
}
/**
 * Update latest translations to crowdin
 */
async function listTranslations(spinner) {
    const url = getURL('status', 'json');
    const { body = '' } = await got(url, { json: true });

    /**
     * Format output of the function when we list translations
     */
    const format = ({ name, code, translated_progress: progress, approved_progress }) => {
        if (argv.type || argv.t) {
            return [code];
        }
        return ['-', chalk.cyan(code), name, `progress: ${progress}%`, `approved: ${approved_progress}%`];
    };

    /**
     * Filter output if we want to extract a portion of translations
     * Based on the limit flag
     */
    const limit = (item) => {
        if (!argv.limit) {
            return true;
        }
        const approved = argv['ignore-approved'] ? true : (item.approved_progress >= argv.limit);
        return item.translated_progress >= argv.limit && approved;
    };
    spinner.stop();
    debug(body);
    _.sortBy(body, [ 'translated_progress', 'approved_progress' ])
        .reverse()
        .filter(limit)
        .forEach((item) => {
            console.log(...format(item));
        });
}

async function main() {

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
    };

    const msg = getSpinnerMessage();
    const spinner = msg ? spin(msg) : { stop: () => {} };

    try {
        if (argv.c || argv.check) {
            await checkExport(spinner);
        }

        if (argv.s || argv.sync) {
            await fetchThemAll(spinner);
        }

        if (argv.e || argv.export) {
            await createExport();
        }

        if (argv.u || argv.update) {
            await udpate(spinner);
        }

        if (argv.l || argv.list) {
            await listTranslations(spinner);
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