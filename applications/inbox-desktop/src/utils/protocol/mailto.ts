import { isMac, OneTimeArgument } from "../helpers";
import { Event, app } from "electron";
import { mainLogger } from "../log";
import { handleMailToUrls } from "../urls/mailtoLinks";

const mailtoArgument = new OneTimeArgument();

export function urlHasMailto(url: string): boolean {
    return url.includes("#mailto=");
}

export function getMailtoArg(argv: string[]): string {
    return argv.find((val: string): boolean => val.startsWith("mailto:")) ?? "";
}

export function checkArgsForMailto() {
    const url = getMailtoArg(process.argv);
    if (url) {
        mainLogger.info("Found mailto in arguments:", url);
        mailtoArgument.setOnce(url);
    }
}

export const readAndClearMailtoArgs = (): string => mailtoArgument.readAndClear();

function earlyOpenURLMailto(_e: Event, url: string) {
    mainLogger.log("Open URL called before app is ready:", url);
    mailtoArgument.setOnce(url);
}

export function handleStartupMailto() {
    checkArgsForMailto();

    if (!isMac) {
        return;
    }

    app.on("open-url", earlyOpenURLMailto);
}

export function handleAppReadyMailto() {
    if (!isMac) {
        return;
    }

    app.off("open-url", earlyOpenURLMailto);
    app.on("open-url", (_ev: Event, url: string) => {
        handleMailToUrls(url);
    });
}
