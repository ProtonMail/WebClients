import { c } from 'ttag';

export const getLinkIconText = ({
    isFile,
    mimeType,
    linkName,
}: {
    linkName: string;
    isFile: boolean;
    mimeType: string;
}) => `${!isFile ? c('Label').t`Folder` : `${c('Label').t`File`} - ${mimeType}`} - ${linkName}`;

export const getDeviceIconText = (name: string) => {
    return `${c('Label').t`Device`} - ${name}`;
};
