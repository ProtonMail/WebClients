import { app } from "electron";
import { basename, dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Packaged resources loaded outside the asar archive.
 * Used to scope ERR_FILE_NOT_FOUND Sentry filtering to known app assets only.
 */
const TRACKED_PACKAGED_RESOURCE_FILES = [
    "loading.html",
    "blank.html",
    "error-network.html",
    "error-network.svg",
    "icon.png",
    "icon.ico",
] as const;

function getPackagedResourcesPath(): string {
    return dirname(app.getAppPath());
}

function getUnpackagedResourcesPath(): string {
    return join(app.getAppPath(), "assets");
}

const _RESOURCES_PATH = app.isPackaged ? getPackagedResourcesPath() : getUnpackagedResourcesPath();

// On Windows, Node/Electron path APIs disagree on drive-letter case (e.g. C:\ vs c:\),
// so lowercase to make set lookups consistent across the two path sources.
const isWin = process.platform === "win32";
const canon = (p: string) => (isWin ? normalize(p).toLowerCase() : normalize(p));

function getFileResourcePath(filename: string): string {
    return join(_RESOURCES_PATH, filename);
}

function getIconResourcePath(filename: string): string {
    const filepath = app.isPackaged ? [filename] : ["icons", filename];
    return join(_RESOURCES_PATH, ...filepath);
}

const TRACKED_RESOURCE_FILENAMES: ReadonlySet<string> = new Set(TRACKED_PACKAGED_RESOURCE_FILES.map((f) => canon(f)));

const EXPECTED_RESOURCE_PATHS: ReadonlySet<string> = new Set(
    TRACKED_PACKAGED_RESOURCE_FILES.map((f) => canon(getFileResourcePath(f))),
);

function fileURLToLocalPath(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "file:") return null;
        return fileURLToPath(parsed);
    } catch {
        return null;
    }
}

function shouldReportAssetIssue(url: string): boolean {
    // Parse the URL (file protocol), if unable to parse, report it to Sentry.
    const path = fileURLToLocalPath(url);
    if (!path) return true;

    // Check if we are tracking this resource, if not report it to sentry.
    if (!TRACKED_RESOURCE_FILENAMES.has(canon(basename(path)))) return true;

    // Scope reporting to the expected packaged location to filter out noise.
    return EXPECTED_RESOURCE_PATHS.has(canon(path));
}

export { getFileResourcePath, getIconResourcePath, shouldReportAssetIssue };
