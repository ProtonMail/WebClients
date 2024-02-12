import path from "node:path";
import { constants as FS_CONSTANTS } from "node:fs";
import { mkdir, access, rm } from "node:fs/promises";
import { execaCommand } from "execa";

const DEFAULT_LANGUAGE = "en";
const PO_OUTPUT_FILE = "po/template.pot";

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

    if (await pathExists(PO_OUTPUT_FILE)) {
        await rm(PO_OUTPUT_FILE);
    }

    await mkdir(rootDir, { recursive: true });

    await execaCommand(`npx ttag init ${DEFAULT_LANGUAGE} ${PO_OUTPUT_FILE}`);
    await execaCommand(`npx ttag update ${PO_OUTPUT_FILE} src`);
    console.log("source string extracted to", PO_OUTPUT_FILE);
}

main();
