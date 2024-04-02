import { contextBridge, ipcRenderer } from "electron";
import Logger from "electron-log";
import { IPCClientUpdateMessagePayload, IPCClientUpdateMessageType } from "./ipc/ipcConstants";
import { ThemeSetting } from "./utils/themes";

contextBridge.exposeInMainWorld("ipcInboxMessageBroker", {
    getTheme: (): ThemeSetting => {
        Logger.info("Requesting theme from host");
        return ipcRenderer.sendSync("getTheme");
    },

    send: <T extends IPCClientUpdateMessageType>(
        type: IPCClientUpdateMessageType,
        payload: IPCClientUpdateMessagePayload<T>,
    ) => {
        Logger.info(`Sending IPC message: ${type}`);
        ipcRenderer.send("clientUpdate", { type, payload });
    },
});
