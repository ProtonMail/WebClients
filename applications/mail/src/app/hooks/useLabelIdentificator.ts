import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import {
    isCustomFolder,
    isCustomLabel,
    isSystemFolder,
    isSystemLabel,
    isSystemLocation,
} from '@proton/mail/helpers/location';

export const useLabelIDIdentifier = () => {
    const [customLabels] = useLabels();
    const [customFolders] = useFolders();

    return (labelID: string) => {
        return {
            isCustomLabel: isCustomLabel(labelID, customLabels),
            isCustomFolder: isCustomFolder(labelID, customFolders),
            isSystemLabel: isSystemLabel(labelID),
            isSystemFolder: isSystemFolder(labelID),
            isSystemLocation: isSystemLocation(labelID),
            isCategory: false, // TODO: implement this once categories are defined in MAILBOX_LABEL_IDS
        };
    };
};
