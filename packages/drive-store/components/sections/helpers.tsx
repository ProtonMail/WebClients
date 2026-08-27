export const selectMessageForItemList = (
    isFiles: boolean[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = isFiles.every((isFile) => isFile);
    const allFolders = isFiles.every((isFile) => !isFile);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};
