import { renderHook, waitFor } from '@testing-library/react';

import { useFetchDownloadLinks } from './useFetchDownloadLinks';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('fast-xml-parser', () => ({
    XMLParser: vi.fn().mockImplementation(function () {
        return {
            parse: vi.fn().mockReturnValue({
                rss: {
                    channel: {
                        item: [
                            {
                                minimumSystemVersion: 14,
                                enclosure: { '@_url': 'https://protonvpn.com/download/mac_v6.dmg' },
                            },
                        ],
                    },
                },
            }),
        };
    }),
}));

describe('useFetchDownloadLinks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when flag is false', () => {
        it('does not call fetch', () => {
            renderHook(() => useFetchDownloadLinks(false));

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('returns hardcoded windows links', async () => {
            const { result } = renderHook(() => useFetchDownloadLinks(false));

            await waitFor(() => {
                expect(result.current.windows).toBeDefined();
            });

            expect(result.current.windows).toHaveLength(2);
            expect(result.current.windows![0].link).toContain('x64.exe');
            expect(result.current.windows![1].link).toContain('arm64.exe');
        });

        it('returns hardcoded mac links', async () => {
            const { result } = renderHook(() => useFetchDownloadLinks(false));

            await waitFor(() => {
                expect(result.current.mac).toBeDefined();
            });

            expect(result.current.mac).toHaveLength(6);
            expect(result.current.mac![0].link).toContain('ProtonVPN_mac_v6.3.0.dmg');
        });
    });

    describe('when flag is true', () => {
        it('calls fetch for windows endpoints', async () => {
            mockFetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    Releases: [{ CategoryName: 'Stable', File: { Url: 'https://protonvpn.com/download/win.exe' } }],
                }),
                text: vi.fn().mockResolvedValue('<rss></rss>'),
            });

            renderHook(() => useFetchDownloadLinks(true));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });

            const calledUrls = mockFetch.mock.calls.map((args) => args[0]);
            expect(calledUrls).toContain('https://protonvpn.com/download/windows/x64/v1/version.json');
            expect(calledUrls).toContain('https://protonvpn.com/download/windows/arm64/v1/version.json');
        });

        it('calls fetch for mac endpoints', async () => {
            mockFetch.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ Releases: [] }),
                text: vi.fn().mockResolvedValue('<rss></rss>'),
            });

            renderHook(() => useFetchDownloadLinks(true));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });

            const calledUrls = mockFetch.mock.calls.map((args) => args[0]);
            expect(calledUrls).toContain('https://protonvpn.com/download/macos-update5.xml');
            expect(calledUrls).toContain('https://protonvpn.com/download/macos-update2.xml');
        });

        it('returns windows links from the fetched data', async () => {
            mockFetch.mockImplementation((url: string) => {
                if (url.includes('windows')) {
                    return Promise.resolve({
                        json: vi.fn().mockResolvedValue({
                            Releases: [
                                {
                                    CategoryName: 'Stable',
                                    File: { Url: 'https://protonvpn.com/download/win_fetched.exe' },
                                },
                            ],
                        }),
                    });
                }
                return Promise.resolve({
                    text: vi.fn().mockResolvedValue('<rss></rss>'),
                });
            });

            const { result } = renderHook(() => useFetchDownloadLinks(true));

            await waitFor(() => {
                expect(result.current.windows).toBeDefined();
            });

            expect(result.current.windows![0].link).toBe('https://protonvpn.com/download/win_fetched.exe');
        });
    });
});
