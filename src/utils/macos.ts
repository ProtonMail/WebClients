import nodeCrypto from "crypto";
import { app } from "electron";
import { readdirSync, rmSync, writeFileSync } from "original-fs";
import { join } from "path";
import { MACOS_PARTITION } from "./constants";
import { getBasePath } from "./helpers";

export const macosStartup = () => {
    const macosPartition = getMacOSPartition();

    // If partition is present we return it
    if (macosPartition) {
        return macosPartition;
    } else {
        // If the partition is not present we clear the user data folder and create a new partition
        // This happens when the application is reinstalled and it's done to prevent keeping old data
        clearUserDataFolder();
        const newPartition = createNewMacOSPartition();
        saveNewPartition(newPartition);
        return newPartition;
    }
};

const getMacOSPartition = () => {
    const basePath = getBasePath();
    const macosPartition = readdirSync(basePath).find((item) => item.startsWith(MACOS_PARTITION));

    return macosPartition;
};

const saveNewPartition = (partition: string) => {
    const basePath = getBasePath();
    const partitionPath = join(basePath, partition);
    writeFileSync(partitionPath, "");
};

const createNewMacOSPartition = () => {
    return `${MACOS_PARTITION}-${nodeCrypto.randomUUID()}`;
};

const clearUserDataFolder = () => {
    const basePath = app.getPath("userData");
    rmSync(basePath, { recursive: true, force: true });
};
