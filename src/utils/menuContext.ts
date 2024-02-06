import { BrowserWindow, ContextMenuParams, Menu, MenuItemConstructorOptions, app } from "electron";
import { isMac } from "./helpers";

const getContextMenuSpellCheck = (props: ContextMenuParams, window: BrowserWindow) => {
    if (!props.dictionarySuggestions || props.dictionarySuggestions.length === 0) {
        return [];
    }

    const template: MenuItemConstructorOptions[] = [];
    props.dictionarySuggestions.forEach((suggestion) => {
        template.push({
            label: suggestion,
            click: () => window.webContents.replaceMisspelling(suggestion),
        });
    });

    template.push({ type: "separator" });
    template.push({
        label: "Add to dictionary",
        click: () => window.webContents.session.addWordToSpellCheckerDictionary(props.misspelledWord),
    });
    template.push({ type: "separator" });

    return template;
};

const getContextEditFlags = (props: ContextMenuParams) => {
    const template: MenuItemConstructorOptions[] = [];
    if (props.isEditable) {
        if (app.isEmojiPanelSupported()) {
            template.push({ label: `Emoji and Symbols`, click: () => app.showEmojiPanel() });
        }

        template.push(
            { type: "separator" },
            { role: "undo", enabled: props.editFlags.canUndo },
            { role: "redo", enabled: props.editFlags.canRedo },
            { type: "separator" },
        );
    }

    if (props.editFlags.canCut) {
        template.push({ role: "cut" });
    }
    if (props.editFlags.canCopy) {
        template.push({ role: "copy" });
    }
    if (props.editFlags.canPaste) {
        template.push({ role: "paste" });
    }
    if (props.editFlags.canPaste) {
        template.push({ role: "pasteAndMatchStyle" });
    }

    return template;
};

const getContextMenu = (props: ContextMenuParams, entriesBefore: boolean) => {
    const template: MenuItemConstructorOptions[] = [];
    if (entriesBefore) {
        template.push({ type: "separator" });
    }

    if (props.editFlags.canSelectAll && props.selectionText.length > 0) {
        template.push({ role: "selectAll" });
    }

    if (isMac && props.selectionText.length > 0) {
        template.push({ label: "Speech", submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }] });
    }

    if (props.mediaType === "image") {
        template.push({ type: "separator" });
        template.push({
            label: "Save image as…",
            click: () => BrowserWindow.getFocusedWindow().webContents.downloadURL(props.srcURL),
        });
        template.push({
            label: "Copy image",
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.copyImageAt(props.x, props.y);
            },
        });
        template.push({ type: "separator" });
    }

    return template;
};

export const createContextMenu = (props: ContextMenuParams, window: BrowserWindow) => {
    const spellCheckTemplate = getContextMenuSpellCheck(props, window);
    const flagsTemplate = getContextEditFlags(props);
    const context = getContextMenu(props, spellCheckTemplate.length > 0 || flagsTemplate.length > 0);

    const template = [...spellCheckTemplate, ...flagsTemplate, ...context];

    if (template.length > 0) {
        return Menu.buildFromTemplate(template);
    }

    return new Menu();
};
