import { ipcMain } from "electron";
import { handleIPCBadge } from "./badge";

export const handleIPCCalls = () => {
    ipcMain.on("updateNotification", (_e, count: number) => handleIPCBadge(count));
};
