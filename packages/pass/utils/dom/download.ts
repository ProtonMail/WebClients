import downloadFile from '@proton/shared/lib/helpers/downloadFile';

export const download = (file: File, filename?: string) => downloadFile(file, filename ?? file.name);
