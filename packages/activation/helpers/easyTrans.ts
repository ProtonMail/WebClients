import { c, msgid } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

class GetLabelsTranslation implements TranslationInterface {
    public infoHeader = () =>
        c('Info')
            .t`Create a label for the imported messages, a time range for this import, and the labels you would like to import.`;

    public hide = () => c('Action').t`Hide labels`;

    public show = () => c('Action').t`Show labels`;

    public manage = () => c('Action').t`Manage labels`;

    public editName = () => c('Tooltip').t`Edit label names`;

    public totalCount = (totalFoldersCount: number) =>
        c('Info').ngettext(
            msgid`All (${totalFoldersCount} label)`,
            `All (${totalFoldersCount} labels)`,
            totalFoldersCount
        );

    public partialCount = (selectedFoldersCount: number) =>
        c('Info').ngettext(
            msgid`${selectedFoldersCount} label selected`,
            `${selectedFoldersCount} labels selected`,
            selectedFoldersCount
        );

    public errorNameTooLong = () => c('Error').t`The label name is too long. Please choose a different name.`;

    public errorEmptyValue = () => c('Error').t`Label name cannot be empty.`;

    public errorNameAlreadyExists = () =>
        c('Error').t`This label name is not available. Please choose a different name.`;

    public errorReservedName = () => c('Error').t`The label name is invalid. Please choose a different name.`;

    public errorMaxItems = () => c('Tooltip').t`Customize import to reduce the number of labels`;

    public errorItemsLimit = () =>
        c('Error')
            .t`Some of your label names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`;

    public errorUnavailableName = () =>
        c('Error').t`Some of your label names are unavailable. Please customize the import to edit these names.`;

    public foundCount = (providerFoldersNumLocalized: string, providerFoldersNum: number) =>
        c('Info').ngettext(
            msgid`${providerFoldersNumLocalized} label found in Gmail`,
            `${providerFoldersNumLocalized} labels found in Gmail`,
            providerFoldersNum
        );

    public selectedCount = (selectedFoldersCountLocalized: string, selectedFoldersCount: number) =>
        c('Info').ngettext(
            msgid`${selectedFoldersCountLocalized} label selected`,
            `${selectedFoldersCountLocalized} labels selected`,
            selectedFoldersCount
        );
}

class GetFoldersTranslation implements TranslationInterface {
    public infoHeader = () =>
        c('Info')
            .t`Create a label for the imported messages, a time range for this import, and the folders you would like to import.`;

    public hide = () => c('Action').t`Hide folders`;

    public show = () => c('Action').t`Show folders`;

    public manage = () => c('Action').t`Manage folders`;

    public editName = () => c('Tooltip').t`Edit folder names`;

    public totalCount = (totalFoldersCount: number) =>
        c('Info').ngettext(
            msgid`All (${totalFoldersCount} folder)`,
            `All (${totalFoldersCount} folders)`,
            totalFoldersCount
        );

    public partialCount = (selectedFoldersCount: number) =>
        c('Info').ngettext(
            msgid`${selectedFoldersCount} folder selected`,
            `${selectedFoldersCount} folders selected`,
            selectedFoldersCount
        );

    public errorNameTooLong = () => c('Error').t`The folder name is too long. Please choose a different name.`;

    public errorEmptyValue = () => c('Error').t`Folder name cannot be empty.`;

    public errorNameAlreadyExists = () =>
        c('Error').t`This folder name is not available. Please choose a different name.`;

    public errorReservedName = () => c('Error').t`The folder name is invalid. Please choose a different name.`;

    public errorMaxItems = () => c('Tooltip').t`Customize import to reduce the number of folders`;

    public errorItemsLimit = () =>
        c('Error')
            .t`Some of your folder names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`;

    public errorUnavailableName = () =>
        c('Error').t`Some of your folder names are unavailable. Please customize the import to edit these names.`;

    public foundCount = (providerFoldersNumLocalized: string, providerFoldersNum: number) =>
        c('Info').ngettext(
            msgid`${providerFoldersNumLocalized} folder found`,
            `${providerFoldersNumLocalized} folders found`,
            providerFoldersNum
        );

    public selectedCount = (selectedFoldersCountLocalized: string, selectedFoldersCount: number) =>
        c('Info').ngettext(
            msgid`${selectedFoldersCountLocalized} folder selected`,
            `${selectedFoldersCountLocalized} folders selected`,
            selectedFoldersCount
        );
}

export class EasyTrans {
    private static labelInstance = new GetLabelsTranslation();

    private static folderInstance = new GetFoldersTranslation();

    public static get(isLabelMapping: boolean): GetLabelsTranslation | GetFoldersTranslation {
        return isLabelMapping ? this.labelInstance : this.folderInstance;
    }
}

interface TranslationInterface {
    infoHeader: () => string;
    hide: () => string;
    show: () => string;
    manage: () => string;
    editName: () => string;
    errorNameTooLong: () => string;
    errorEmptyValue: () => string;
    errorNameAlreadyExists: () => string;
    errorReservedName: () => string;
    errorMaxItems: () => string;
    errorItemsLimit: () => string;
    errorUnavailableName: () => string;
    totalCount: (totalFoldersCount: number) => string;
    partialCount: (selectedFoldersCount: number) => string;
    foundCount: (totalFoldersCount: string, providerFoldersNum: number) => string;
    selectedCount: (selectedFoldersCountLocalized: string, selectedFoldersCount: number) => string;
}
