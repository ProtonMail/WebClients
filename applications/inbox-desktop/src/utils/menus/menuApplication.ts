import { app, Menu, shell, WebContentsView, type MenuItemConstructorOptions } from "electron";
import { c } from "ttag";
import { uninstallProton } from "../../macos/uninstall";
import { clearStorage, isMac } from "../helpers";
import { getMainWindow, getSpellCheckStatus, resetZoom, toggleSpellCheck, updateZoom } from "../view/viewManagement";
import { isProdEnv } from "../isProdEnv";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";

type MenuKey = "app" | "file" | "edit" | "view" | "window";
interface MenuProps extends MenuItemConstructorOptions {
    key: MenuKey;
}

export const setApplicationMenu = () => {
    const quitMenuProps: MenuProps["submenu"] = isMac ? [] : [{ role: "quit", label: c("App menu").t`Quit` }];

    const temp: MenuProps[] = [
        {
            label: c("Menu").t`File`,
            key: "file",
            submenu: [
                {
                    label: c("App menu").t`Clear application data`,
                    type: "normal",
                    click: () => clearStorage(),
                },
                {
                    label: c("App menu").t`Show logs`,
                    type: "normal",
                    click: () => shell.openPath(app.getPath("logs")),
                },
                ...quitMenuProps,
            ],
        },
        {
            label: c("Menu").t`Edit`,
            key: "edit",
            submenu: [
                { role: "undo", label: c("App menu").t`Undo` },
                { role: "redo", label: c("App menu").t`Redo` },
                { type: "separator" },
                { role: "cut", label: c("App menu").t`Cut` },
                { role: "copy", label: c("App menu").t`Copy` },
                { role: "paste", label: c("App menu").t`Paste` },
                {
                    role: "pasteAndMatchStyle",
                    accelerator: "CmdOrCtrl+Shift+V",
                    label: c("App menu").t`Paste and Match Style`,
                },
                { role: "delete", label: c("App menu").t`Delete` },
                { role: "selectAll", label: c("App menu").t`Select All` },
                { type: "separator" },
                {
                    label: c("App menu").t`Check spelling while typing`,
                    type: "checkbox",
                    checked: getSpellCheckStatus(),
                    click: (item) => {
                        toggleSpellCheck(item.checked);
                    },
                },
            ],
        },
        {
            label: c("Menu").t`View`,
            key: "view",
            submenu: [
                {
                    label: c("App menu").t`Reload`,
                    accelerator: "CmdOrCtrl+R",
                    click: () => {
                        const mainWindow = getMainWindow();
                        if (mainWindow) {
                            // We need to force WebContentsView type here because getContentView() has a type bug.
                            const view = mainWindow.getContentView() as unknown as WebContentsView;
                            if (view) {
                                view.webContents.reload();
                            } else {
                                mainWindow.webContents.reload();
                            }
                        }
                    },
                },
                {
                    label: c("App menu").t`Force Reload`,
                    accelerator: "CmdOrCtrl+Shift+R",
                    click: () => {
                        const mainWindow = getMainWindow();
                        if (mainWindow) {
                            // We need to force WebContentsView type here because getContentView() has a type bug.
                            const view = mainWindow.getContentView() as unknown as WebContentsView;
                            if (view) {
                                view.webContents.reloadIgnoringCache();
                            } else {
                                mainWindow.webContents.reloadIgnoringCache();
                            }
                        }
                    },
                },
                { type: "separator" },
                { label: c("App menu").t`Actual Size`, accelerator: "CmdOrCtrl+0", click: resetZoom },
                { label: c("App menu").t`Zoom In`, accelerator: "CmdOrCtrl+Plus", click: () => updateZoom("in") },
                { label: c("App menu").t`Zoom Out`, accelerator: "CmdOrCtrl+-", click: () => updateZoom("out") },
                { type: "separator" },
                { role: "togglefullscreen", label: c("App menu").t`Toggle Full Screen` },
            ],
        },
        {
            label: c("Menu").t`Window`,
            key: "window",
            submenu: [
                { role: "minimize", label: c("App menu").t`Minimize` },
                { role: "close", label: c("App menu").t`Close Window` },
                { role: "zoom", label: c("App menu").t`Zoom` },
            ],
        },
    ];

    if (isMac) {
        const editIndex = temp.findIndex((item) => item.key === "edit");
        if (editIndex !== -1) {
            const submenus = temp[editIndex].submenu as Electron.MenuItemConstructorOptions[];
            submenus.push({
                label: c("App menu").t`Speech`,
                submenu: [
                    { role: "startSpeaking", label: c("App menu").t`Start Speaking` },
                    { role: "stopSpeaking", label: c("App menu").t`Stop Speaking` },
                ],
            });
            temp[editIndex].submenu = submenus;
        }

        temp.unshift({
            label: app.name,
            key: "app",
            submenu: [
                { role: "about", label: c("App menu").t`About ${MAIL_APP_NAME}` },
                { type: "separator" },
                { role: "hide", label: c("App menu").t`Hide ${MAIL_APP_NAME}` },
                { role: "hideOthers", label: c("App menu").t`Hide Others` },
                { role: "unhide", label: c("App menu").t`Show All` },
                { type: "separator" },
                {
                    label: c("App menu").t`Start ${MAIL_APP_NAME} at login`,
                    type: "checkbox",
                    checked: app.getLoginItemSettings().openAtLogin,
                    click: () => {
                        app.setLoginItemSettings({
                            openAtLogin: !app.getLoginItemSettings().openAtLogin,
                        });
                    },
                },
                {
                    label: c("App menu").t`Uninstall ${MAIL_APP_NAME}`,
                    type: "normal",
                    click: () => uninstallProton(),
                },
                { type: "separator" },
                { role: "quit", label: c("App menu").t`Quit ${MAIL_APP_NAME}` },
            ],
        });

        if (!isProdEnv()) {
            const submenu = temp[0].submenu as MenuItemConstructorOptions[];
            temp[0].submenu = [
                ...submenu,
                { type: "separator" },
                { role: "services", label: c("App Menu").t`Services` },
            ];
        }
    }

    const menu = Menu.buildFromTemplate(temp);
    Menu.setApplicationMenu(menu);
};
