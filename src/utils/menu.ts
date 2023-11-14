import { app, Menu, type MenuItemConstructorOptions } from "electron";
import { clearStorage, isMac, openLogFolder } from "./helpers";

interface MenuInsertProps {
    menu: MenuItemConstructorOptions[];
    key: MenuItemConstructorOptions["label"];
    otherOsEntries?: MenuItemConstructorOptions[];
    macEntries?: MenuItemConstructorOptions[];
    allOSEntries?: MenuItemConstructorOptions[];
}

const insertInMenu = ({ menu, key, otherOsEntries, macEntries, allOSEntries }: MenuInsertProps) => {
    const editIndex = menu.findIndex((item) => item.label === key);
    if (!editIndex) return;

    const submenu = menu[editIndex].submenu as MenuItemConstructorOptions[];
    if (isMac && macEntries) {
        menu[editIndex].submenu = [...submenu, ...macEntries];
    } else if (!isMac && otherOsEntries) {
        menu[editIndex].submenu = [...submenu, ...otherOsEntries];
    }

    menu[editIndex].submenu = [...submenu, ...(allOSEntries ?? [])];
};

export const setApplicationMenu = (isPackaged: boolean) => {
    const temp: MenuItemConstructorOptions[] = [
        {
            label: "File",
            submenu: [
                {
                    label: "Clear application data",
                    type: "normal",
                    click: () => clearStorage(true),
                },
                {
                    label: "Show logs",
                    type: "normal",
                    click: () => openLogFolder(),
                },
                {
                    role: "quit",
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "selectAll" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        {
            label: "Window",
            submenu: [{ role: "minimize" }, { role: "zoom" }],
        },
    ];

    if (isMac) {
        temp.unshift({
            label: app.name,
            submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
            ],
        });

        if (!isPackaged) {
            const submenu = temp[0].submenu as MenuItemConstructorOptions[];
            temp[0].submenu = [...submenu, { type: "separator" }, { role: "services" }];
        }
    }

    insertInMenu({
        menu: temp,
        key: "Edit",
        otherOsEntries: [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }],
        macEntries: [
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
        ],
    });

    insertInMenu({
        menu: temp,
        key: "Window",
        otherOsEntries: [{ role: "close" }],
        macEntries: [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }],
    });

    if (!isPackaged) {
        insertInMenu({
            menu: temp,
            key: "View",
            allOSEntries: [{ type: "separator" }, { role: "toggleDevTools" }],
        });
    }

    const menu = Menu.buildFromTemplate(temp);
    Menu.setApplicationMenu(menu);
};
