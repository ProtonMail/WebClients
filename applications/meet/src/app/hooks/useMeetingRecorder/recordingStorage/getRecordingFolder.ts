const ENCRYPTED_RECORDING_FOLDER_SUFFIX = '-encrypted';

export const getRecordingFolder = (userId: string) => `${userId}${ENCRYPTED_RECORDING_FOLDER_SUFFIX}`;

export const isEncryptedRecordingFolder = (folder?: string) => !!folder?.endsWith(ENCRYPTED_RECORDING_FOLDER_SUFFIX);
