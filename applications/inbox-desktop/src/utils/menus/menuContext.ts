import { ContextMenuParams, Menu, MenuItemConstructorOptions, WebContentsView, app, clipboard } from "electron";
import { c } from "ttag";
import { isMac, smartTruncateText } from "../helpers";
import { getCurrentView, getMainWindow } from "../view/viewManagement";

const getContextMenuSpellCheck = (props: ContextMenuParams, view: WebContentsView) => {
    if (!props.dictionarySuggestions || props.dictionarySuggestions.length === 0) {
        return [];
    }

    const template: MenuItemConstructorOptions[] = [];
    props.dictionarySuggestions.forEach((suggestion) => {
        template.push({
            label: suggestion,
            click: () => view.webContents.replaceMisspelling(suggestion),
        });
    });

    template.push({ type: "separator" });
    template.push({
        label: c("Context menu").t`Add to dictionary`,
        click: () => view.webContents.session.addWordToSpellCheckerDictionary(props.misspelledWord),
    });
    template.push({ type: "separator" });

    return template;
};

const getContextEditFlags = (props: ContextMenuParams) => {
    const template: MenuItemConstructorOptions[] = [];
    if (props.isEditable) {
        if (app.isEmojiPanelSupported()) {
            template.push({ label: c("Context menu").t`Emoji and Symbols`, click: () => app.showEmojiPanel() });
        }

        template.push(
            { type: "separator" },
            { role: "undo", label: c("Context Menu").t`Undo`, enabled: props.editFlags.canUndo },
            { role: "redo", label: c("Context Menu").t`Redo`, enabled: props.editFlags.canRedo },
            { type: "separator" },
        );
    }

    if (isMac && props.editFlags.canCopy) {
        const text = smartTruncateText(props.selectionText, 50);
        template.push({
            // translator: this looks up the definition of a word
            label: c("Context Menu").t`Look Up “${text}”`,
            click: () => getCurrentView()?.webContents.showDefinitionForSelection(),
        });
    }

    if (props.editFlags.canCut) {
        template.push({ role: "cut", label: c("Context Menu").t`Cut` });
    }

    if (props.editFlags.canCopy) {
        template.push({ role: "copy", label: c("Context Menu").t`Copy` });
    }

    if (props.linkURL) {
        if (!props.editFlags.canCopy && props.linkText) {
            template.push({
                label: c("Context Menu").t`Copy`,
                click: () => clipboard.writeText(props.linkText),
            });
        }

        template.push({
            label: c("Context menu").t`Copy link`,
            click: () => clipboard.writeText(props.linkURL),
        });
    }

    if (props.editFlags.canPaste) {
        template.push({ role: "paste", label: c("Context Menu").t`Paste` });
    }
    if (props.editFlags.canPaste) {
        template.push({ role: "pasteAndMatchStyle", label: c("Context Menu").t`Paste and Match Style` });
    }

    return template;
};

const getContextMenu = (props: ContextMenuParams, entriesBefore: boolean) => {
    const template: MenuItemConstructorOptions[] = [];
    if (entriesBefore) {
        template.push({ type: "separator" });
    }

    if (props.editFlags.canSelectAll && props.selectionText.length > 0) {
        template.push({ role: "selectAll", label: c("Context Menu").t`Select All` });
    }

    if (isMac && props.selectionText.length > 0) {
        template.push({
            label: c("Context menu").t`Speech`,
            submenu: [
                { role: "startSpeaking", label: c("Context menu").t`Start Speaking` },
                { role: "stopSpeaking", label: c("Context menu").t`Stop Speaking` },
            ],
        });
    }

    if (props.mediaType === "image") {
        template.push({ type: "separator" });
        template.push({
            label: c("Context menu").t`Save image as…`,
            click: () => getMainWindow()?.webContents.downloadURL(props.srcURL),
        });
        template.push({ type: "separator" });
    }

    return template;
};

export const createContextMenu = (props: ContextMenuParams, view: WebContentsView): Menu | undefined => {
    const spellCheckTemplate = getContextMenuSpellCheck(props, view);
    const flagsTemplate = getContextEditFlags(props);
    const context = getContextMenu(props, spellCheckTemplate.length > 0 || flagsTemplate.length > 0);

    const template = [...spellCheckTemplate, ...flagsTemplate, ...context];

    if (template.length > 0) {
        return Menu.buildFromTemplate(template);
    }

    return undefined;
};
