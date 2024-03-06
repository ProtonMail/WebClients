import Logger from "electron-log";
import { updateElectronApp } from "update-electron-app";
import { z } from "zod";
import { getPlatform } from "./utils/helpers";

const baseURL = `https://proton.me/download/mail/${getPlatform()}`;
const jsonVersion = `${baseURL}/version.json`;

const versionJSOn = z.object({
    early: z.object({
        Version: z.string(),
        RolloutProportion: z.number(),
    }),
});

export const checkForUpdates = () => {
    Logger.info("checkForUpdates");

    updateElectronApp({
        repo: "ProtonMail/inbox-desktop",
        updateInterval: "1 hour",
        logger: Logger,
    });
};
