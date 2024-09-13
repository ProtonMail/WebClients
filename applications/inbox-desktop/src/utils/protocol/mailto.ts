import { isMac } from "../helpers";
import { Event, app } from "electron";
import { mainLogger } from "../log";
import { handleMailToUrls } from "../urls/mailtoLinks";

let mailtoArgument = "";
let mailtoAdded = false;

export function urlHasMailto(url: string): boolean {
    return url.includes("#mailto=");
}

function addMailtoArgOnce(url: string) {
    if (mailtoAdded) {
        return;
    }

    mainLogger.info("Adding mailto argument:", url);
    mailtoArgument = url;
    mailtoAdded = true;
}

function getMailtoArg(argv: string[]): string {
    return argv.find((val: string): boolean => val.startsWith("mailto:")) ?? "";
}

export function checkArgsForMailto() {
    const url = getMailtoArg(process.argv);
    if (url) {
        mainLogger.info("Found mailto in arguments:", url);
        addMailtoArgOnce(url);
    }
}

export function readAndClearMailtoArgs(): string {
    mainLogger.info("Read and clear mailto argument", mailtoArgument);
    const tmp = mailtoArgument;
    mailtoArgument = "";
    return tmp;
}

function earlyOpenURLMailto(_e: Event, url: string) {
    mainLogger.log("Open URL called before app is ready:", url);
    addMailtoArgOnce(url);
}

export function handleStartupMailto() {
    checkArgsForMailto();

    if (!isMac) {
        return;
    }

    app.on("open-url", earlyOpenURLMailto);
}

export function handleAppReadyMailto() {
    app.on("second-instance", (_ev: Event, argv: string[]) => {
        handleMailToUrls(getMailtoArg(argv));
    });

    if (!isMac) {
        return;
    }

    app.off("open-url", earlyOpenURLMailto);
    app.on("open-url", (_ev: Event, url: string) => {
        handleMailToUrls(url);
    });
}
