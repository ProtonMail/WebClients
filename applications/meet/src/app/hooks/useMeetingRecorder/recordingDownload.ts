import { isChromiumBased } from '@proton/shared/lib/helpers/browser';

import type { RecordingCodec } from './codec/types';
import type { RecordingArtifact } from './recordingStorage/types';

const streamToDisk = async (recordingArtifact: RecordingArtifact, fileName: string): Promise<boolean> => {
    if (typeof window.showSaveFilePicker !== 'function') {
        return false;
    }

    const handle = await window.showSaveFilePicker({ suggestedName: fileName });
    const writable = await handle.createWritable();

    try {
        for (const file of recordingArtifact.files) {
            await file.stream().pipeTo(writable, { preventClose: true });
        }

        await writable.close();
    } catch (error) {
        if (typeof writable.abort === 'function') {
            await writable.abort(error).catch(() => {});
        }

        throw error;
    }

    return true;
};

const convertToBlobAndDownload = (recordingArtifact: RecordingArtifact, fileName: string) => {
    const blob = new Blob(recordingArtifact.files, { type: recordingArtifact.mimeType });

    if (blob.size === 0) {
        throw new Error('Recording download failed: empty or missing blob');
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export const downloadRecordingFileToDisk = async (
    recordingArtifact: RecordingArtifact,
    codec: RecordingCodec | null
) => {
    const fileName = `meeting-recording-${new Date().toISOString()}.${codec?.extension ?? 'mp4'}`;

    // First try to stream to disk for chromium based browsers
    if (!isChromiumBased() || !(await streamToDisk(recordingArtifact, fileName))) {
        // If it's not chromium based or stream to disk failed, convert to blob and download
        convertToBlobAndDownload(recordingArtifact, fileName);
    }
};
