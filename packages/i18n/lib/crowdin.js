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

const { error, json, title, success } = require('./helpers/log')('proton-i18n');

const DEST_FILE = 'ProtonMail Web Application.pot';
const PROJECT_NAME = 'protonmail';
const TEMPLATE_FILE = 'template.pot';
const OUTPUT_I18N_DIR = path.join(path.resolve(__dirname, '..'), 'po');
const TEMPLATE_FILE_PATH = path.join(OUTPUT_I18N_DIR, TEMPLATE_FILE);

// if (!process.env.CROWDIN_KEY_API) {
//     error(new Error('You must have env/.env to deploy. cf the Wiki'));
// }

// console.log('Need to define PROJECT_NAME and DEST_FILE via the env');
// process.exit(1);

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

function debug(item) {
    if (!(argv.v || argv.verbose)) {
        return;
    }
    if (Array.isArray(item)) {
        return json(item);
    }

    console.log(item);
}

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
async function fetchThemAll() {
    if (!fs.existsSync('env/i18n.txt')) {
        throw new Error('You must create a file env/i18n.txt. More informations on the wiki');
    }

    const content = fs.readFileSync('env/i18n.txt', 'utf8').toString();
    const list = content.split('\n').filter(Boolean);
    debug(list);
    // Extract only files from our selection list
    const zip = await downloadAll();
    const fileList = list.map(async (lang) => {
        const input = path.join(lang, `ProtonMail Web Application-${lang}.po`);
        const file = await zip.file(input).async('string');
        return { lang, file };
    });
    const files = await Promise.all(fileList);

    // Write them on the project
    files.forEach(({ lang, file }) => {
        const fileName = `${translateLang(lang)}.po`;
        const output = path.join(OUTPUT_I18N_DIR, fileName);
        fs.writeFileSync(output, file);
        success(`[${lang}] Import new translation`, { space: false });
    });
}

/**
 * Update latest translations to crowdin
 */
async function udpate() {
    const url = getURL('update-file');
    const form = new FormData();
    form.append(`files[/${DEST_FILE}]`, fs.createReadStream(TEMPLATE_FILE_PATH), {
        filename: `@${TEMPLATE_FILE}`
    });
    const { body = '' } = await got.post(url, { body: form });
    debug(body);
    success('Update crowdin with latest template');
}
/**
 * Update latest translations to crowdin
 */
async function listTranslations() {
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

    debug(body);
    _.sortBy(body, [ 'translated_progress', 'approved_progress' ])
        .reverse()
        .filter(limit)
        .forEach((item) => {
            console.log(...format(item));
        });
}

function main() {

    if (argv.c || argv.check) {
        checkExport().catch(error);
    }

    if (argv.s || argv.sync) {
        fetchThemAll().catch(error);
    }

    if (argv.e || argv.export) {
        createExport().catch(error);
    }

    if (argv.u || argv.update) {
        udpate().catch(error);
    }

    if (argv.l || argv.list) {
        listTranslations().catch(error);
    }

    if (argv.help) {
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

}
module.exports = main;