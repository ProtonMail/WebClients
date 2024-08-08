import { type BrowserWindow, Menu, type MenuItemConstructorOptions, app, shell } from 'electron';
import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { uninstallProton } from '../uninstallers/macos/uninstall';
import { isMac, isProdEnv } from '../utils/platform';

type MenuKey = 'app' | 'file' | 'edit' | 'view' | 'window';
type MenuProps = MenuItemConstructorOptions & { key: MenuKey };

type MenuInsertProps = {
    menu: MenuProps[];
    key: MenuKey;
    otherOsEntries?: MenuItemConstructorOptions[];
    macEntries?: MenuItemConstructorOptions[];
    allOSEntries?: MenuItemConstructorOptions[];
};

const insertInMenu = ({ menu, key, otherOsEntries, macEntries, allOSEntries }: MenuInsertProps) => {
    const editIndex = menu.findIndex((item) => item.key === key);
    if (!editIndex) return;

    const submenu = menu[editIndex].submenu as MenuItemConstructorOptions[];
    if (isMac && macEntries) {
        menu[editIndex].submenu = [...submenu, ...macEntries];
    } else if (!isMac && otherOsEntries) {
        menu[editIndex].submenu = [...submenu, ...otherOsEntries];
    }

    menu[editIndex].submenu = [...submenu, ...(allOSEntries ?? [])];
};

export const setApplicationMenu = (mainWindow: BrowserWindow) => {
    const temp: MenuProps[] = [
        {
            label: c('Menu').t`File`,
            key: 'file',
            submenu: [
                {
                    label: c('App menu').t`Show logs`,
                    type: 'normal',
                    click: () => shell.openPath(app.getPath('logs')),
                },
                {
                    role: 'quit',
                },
            ],
        },
        {
            label: c('Menu').t`Edit`,
            key: 'edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteAndMatchStyle', accelerator: isMac ? 'Cmd+Shift+V' : 'Ctrl+Shift+V' },
                { role: 'selectAll' },
            ],
        },
        {
            label: c('Menu').t`View`,
            key: 'view',
            submenu: [
                {
                    label: c('App menu').t`Reload`,
                    accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
                    click: () => mainWindow.webContents.reload(),
                },
                {
                    label: c('App menu').t`Force Reload`,
                    accelerator: isMac ? 'Cmd+Shift+R' : 'Ctrl+Shift+R',
                    click: () => mainWindow.webContents.reloadIgnoringCache(),
                },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: c('Menu').t`Window`,
            key: 'window',
            submenu: [{ role: 'minimize' }, { role: 'close' }, { role: 'zoom' }],
        },
    ];

    if (isMac) {
        temp.unshift({
            label: app.name,
            key: 'app',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                {
                    label: c('App menu').t`Start ${PASS_APP_NAME} at login`,
                    type: 'checkbox',
                    checked: app.getLoginItemSettings().openAtLogin,
                    click: () => {
                        app.setLoginItemSettings({ openAtLogin: !app.getLoginItemSettings().openAtLogin });
                    },
                },
                {
                    label: c('App menu').t`Uninstall ${PASS_APP_NAME}`,
                    type: 'normal',
                    click: () => uninstallProton(),
                },
                { type: 'separator' },
                { role: 'quit' },
            ],
        });

        if (!isProdEnv()) {
            const submenu = temp[0].submenu as MenuItemConstructorOptions[];
            temp[0].submenu = [...submenu, { type: 'separator' }, { role: 'services' }];
        }
    }

    insertInMenu({
        menu: temp,
        key: 'edit',
        otherOsEntries: [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }],
        macEntries: [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
                label: c('App menu').t`Speech`,
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
            },
        ],
    });

    if (!isProdEnv() || Boolean(process.env.PASS_DEBUG)) {
        insertInMenu({
            menu: temp,
            key: 'view',
            allOSEntries: [
                { type: 'separator' },
                {
                    label: c('App menu').t`Toggle developers tools`,
                    accelerator: isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
                    click: () => mainWindow.webContents.toggleDevTools(),
                },
            ],
        });
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(temp));
};
