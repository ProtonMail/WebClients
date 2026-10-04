import { contextBridge, ipcRenderer } from "electron";
import { SCREEN_PICKER_CHANNELS, type ScreenPickerBridge } from "./types";

contextBridge.exposeInMainWorld("screenPicker", {
    onInit: (callback) => {
        ipcRenderer.on(SCREEN_PICKER_CHANNELS.init, (_e, init) => callback(init));
    },
    onSources: (callback) => {
        ipcRenderer.on(SCREEN_PICKER_CHANNELS.sources, (_e, sources) => callback(sources));
    },
    select: (selection) => {
        ipcRenderer.send(SCREEN_PICKER_CHANNELS.select, selection);
    },
    cancel: () => {
        ipcRenderer.send(SCREEN_PICKER_CHANNELS.cancel);
    },
} satisfies ScreenPickerBridge);
