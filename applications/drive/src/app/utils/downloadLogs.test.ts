import type { Mock } from 'vitest';

import format from '@proton/shared/lib/date-fns-utc/format';

import { downloadLogs } from './downloadLogs';

vi.mock('@proton/shared/lib/date-fns-utc/format', () => ({
    __esModule: true,
    default: vi.fn(),
}));

describe('downloadLogs', () => {
    let mockElement: Partial<HTMLAnchorElement>;
    let mockSetAttribute: Mock;

    const mockedFormat = vi.mocked(format);

    beforeEach(() => {
        vi.clearAllMocks();

        mockSetAttribute = vi.fn();
        mockElement = {
            setAttribute: mockSetAttribute,
            click: vi.fn(),
            style: {} as any,
        };

        vi.spyOn(document, 'createElement').mockReturnValue(mockElement as HTMLAnchorElement);
        vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
        vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

        mockedFormat.mockReturnValue('2023-12-25_14-30-45');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should join logs with newlines and set correct href', () => {
        const logs = ['log line 1', 'log line 2', 'log line 3'];
        const expectedLogData = 'log line 1\nlog line 2\nlog line 3';

        downloadLogs(logs);

        expect(mockSetAttribute).toHaveBeenCalledWith(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(expectedLogData)
        );
    });

    it('should generate filename with timestamp', () => {
        const logs = ['test log'];

        downloadLogs(logs);

        expect(format).toHaveBeenCalledWith(expect.any(Date), 'yyyy-MM-dd_HH-mm-ss');
        expect(mockSetAttribute).toHaveBeenCalledWith('download', 'proton-drive-2023-12-25_14-30-45.log');
    });

    it('should handle empty logs array by adding "No logs data"', () => {
        const logs: string[] = [];

        downloadLogs(logs);

        expect(mockSetAttribute).toHaveBeenCalledWith(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent('No logs data')
        );
    });

    it('should properly encode special characters', () => {
        const logs = ['log with special chars: <>&"\''];

        downloadLogs(logs);

        expect(mockSetAttribute).toHaveBeenCalledWith(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent('log with special chars: <>&"\'')
        );
    });

    it('should not modify non-empty logs array', () => {
        const logs = ['existing log'];

        downloadLogs(logs);

        expect(mockSetAttribute).toHaveBeenCalledWith(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent('existing log')
        );
    });

    it('should handle single log entry without adding fallback', () => {
        const logs = ['single log entry'];

        downloadLogs(logs);

        expect(mockSetAttribute).toHaveBeenCalledWith(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent('single log entry')
        );
    });
});
