import { getServiceWorkerDownloadMeta } from './download';

describe('getServiceWorkerDownloadMeta', () => {
    const meta = { downloadId: 'id', filename: 'file.bin', mimeType: 'application/octet-stream', size: 1024 };

    it('should drop the size outside iOS so no Content-Length is sent', () => {
        expect(getServiceWorkerDownloadMeta(meta, false)).toEqual({ ...meta, size: undefined });
    });

    it('should keep the size on iOS', () => {
        expect(getServiceWorkerDownloadMeta(meta, true)).toEqual(meta);
    });
});
