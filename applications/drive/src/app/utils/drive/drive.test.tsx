/* eslint-disable react/display-name */
import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import createCache from 'proton-shared/lib/helpers/cache';
import { CacheProvider } from 'react-components';
import DriveCacheProvider, { DriveCache, useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { initDriveAsync } from './drive';
import { ShareMeta } from '../../interfaces/share';

describe('drive utils', () => {
    let driveCache: DriveCache;

    beforeEach(() => {
        const cache = createCache();
        const { result } = renderHook(() => useDriveCache(), {
            wrapper: ({ children }) => (
                <DriveCacheProvider>
                    <CacheProvider cache={cache}>{children}</CacheProvider>
                </DriveCacheProvider>
            ),
        });
        driveCache = result.current;
    });

    describe('initDrive', () => {
        it('should create a volume and render onboarding modal when there are no shares', async () => {
            expect.assertions(2);

            const createVolumeMock = jest.fn().mockResolvedValue({
                Share: {
                    ID: 'share-1',
                    LinkID: 'link-1',
                },
            });
            const getShareMetaMock = jest.fn((shareId: string) =>
                Promise.resolve(
                    ({
                        'share-1': 'test-share-mock',
                    } as { [id: string]: any })[shareId]
                )
            );
            const createOnboardingModalMock = jest.fn();
            const getUserSharesMock = jest.fn().mockResolvedValue([]);

            const result = await initDriveAsync(
                driveCache,
                createVolumeMock,
                getUserSharesMock,
                getShareMetaMock,
                createOnboardingModalMock
            );

            expect(result).toBe('test-share-mock');
            expect(createOnboardingModalMock).toBeCalledTimes(1);
        });

        it('should return default share and initialize other shares in cache', async () => {
            expect.assertions(2);

            const createVolumeMock = jest.fn();
            const createOnboardingModalMock = jest.fn();
            const getUserSharesMock = jest.fn().mockResolvedValue(['share-1', 'share-2']);
            const getShareMetaMock = jest.fn((shareId: string) =>
                Promise.resolve(
                    ({
                        'share-1': 'test-share-mock-1',
                        'share-2': 'test-share-mock-2',
                    } as { [id: string]: any })[shareId]
                )
            );

            let result: ShareMeta | null = null;

            await act(async () => {
                result = await initDriveAsync(
                    driveCache,
                    createVolumeMock,
                    getUserSharesMock,
                    getShareMetaMock,
                    createOnboardingModalMock
                );
            });

            expect(result).toBe('test-share-mock-1');
            expect(driveCache.get.shareIds()).toEqual(['share-1', 'share-2']);
        });
    });
});
