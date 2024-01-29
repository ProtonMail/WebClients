import { ipcMain } from "electron";
import { clearStorage } from "../utils/helpers";
import { handleIPCBadge } from "./badge";

export const handleIPCCalls = () => {
    ipcMain.on("updateNotification", (_e, count: number) => handleIPCBadge(count));
    ipcMain.on("userLogout", () => clearStorage(true, 500));
};
