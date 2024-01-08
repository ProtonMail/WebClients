import { ipcMain } from "electron";
import { handleIPCBadge } from "./badge";
import { IPC_CALLS } from "./ipcConstants";

export const handleIPCCalls = () => {
    ipcMain.on(IPC_CALLS.updateNotification, (_e, count: number) => handleIPCBadge(count));
};
