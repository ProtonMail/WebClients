export type ContextMenuItem = {
    id?: string;
    label?: string;
    type?: 'normal' | 'submenu' | 'checkbox' | 'radio' | 'separator';
    onSelected?: () => Promise<void> | void;
    role?:
        | 'undo'
        | 'redo'
        | 'cut'
        | 'copy'
        | 'paste'
        | 'pasteAndMatchStyle'
        | 'delete'
        | 'selectAll'
        | 'reload'
        | 'forceReload'
        | 'toggleDevTools'
        | 'resetZoom'
        | 'zoomIn'
        | 'zoomOut'
        | 'toggleSpellChecker'
        | 'togglefullscreen'
        | 'window'
        | 'minimize'
        | 'close'
        | 'help'
        | 'about'
        | 'services'
        | 'hide'
        | 'hideOthers'
        | 'unhide'
        | 'quit'
        | 'startSpeaking'
        | 'stopSpeaking'
        | 'zoom'
        | 'front'
        | 'appMenu'
        | 'fileMenu'
        | 'editMenu'
        | 'viewMenu'
        | 'shareMenu'
        | 'recentDocuments'
        | 'toggleTabBar'
        | 'selectNextTab'
        | 'selectPreviousTab'
        | 'showAllTabs'
        | 'mergeAllWindows'
        | 'clearRecentDocuments'
        | 'moveTabToNewWindow'
        | 'windowMenu';
};

export type ContextMenuItemSerializable = Omit<ContextMenuItem, 'onSelected'>;
