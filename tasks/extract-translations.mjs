/**
 * Command to extract source strings for translations
 * @link {https://confluence.protontech.ch/display/CP/Localisation+on+Front-end+-+rules+and+best+practices}
 * ex:
 * `node tasks/extract-translations.mjs` output -> `po/template.pot`
 */
import path from "node:path";
import { constants as FS_CONSTANTS } from "node:fs";
import { mkdir, access, rm } from "node:fs/promises";
import { execaCommand } from "execa";

const DEFAULT_LANGUAGE = "en";
const PO_OUTPUT_FILE = "po/template.pot";

/**
 * Test if a path exists
 * @param {string} itemPath path to a file/directory
 * @return {Promise<bool>} True if it exists
 */
export const pathExists = async (itemPath) => {
    try {
        await access(itemPath, FS_CONSTANTS.R_OK);
        return true;
    } catch (e) {
        return false;
    }
};

async function main() {
    const rootDir = path.dirname(PO_OUTPUT_FILE);

    // always clean previous file -> if we test on our own pc
    if (await pathExists(PO_OUTPUT_FILE)) {
        await rm(PO_OUTPUT_FILE);
    }

    await mkdir(rootDir, { recursive: true });

    await execaCommand(`npx ttag init ${DEFAULT_LANGUAGE} ${PO_OUTPUT_FILE}`);
    await execaCommand(`npx ttag update ${PO_OUTPUT_FILE} src`);
    console.log("source string extracted to", PO_OUTPUT_FILE);
}

main();
