import { FileBrowserItem } from '../components/FileBrowser/interfaces';
import { TransfersStats } from '../components/TransferManager/interfaces';
import { ProgressBarStatus } from '../components/TransferManager/ProgressBar';
import { Transfer, TransferMeta, TransferState } from '../interfaces/transfer';
import {
    calculateProgress,
    getMetaForTransfer,
    getProgressBarStatus,
    isTransferActive,
    isTransferCanceled,
    isTransferCancelError,
    isTransferDone,
    isTransferError,
    isTransferFailed,
    isTransferFinalizing,
    isTransferFinished,
    isTransferInitializing,
    isTransferPaused,
    isTransferProgress,
} from './transfer';

describe('trasfer utils', () => {
    const allStatesList = [
        TransferState.Canceled,
        TransferState.Done,
        TransferState.Error,
        TransferState.Finalizing,
        TransferState.Initializing,
        TransferState.Paused,
        TransferState.Pending,
        TransferState.Progress,
    ];

    describe('isTransferFinished', () => {
        [TransferState.Error, TransferState.Canceled, TransferState.Done].forEach((state) => {
            it(`should return true for transfer state ${state}`, () => {
                expect(isTransferFinished({ state })).toBeTruthy();
            });
        });

        allStatesList
            .filter((state) => ![TransferState.Error, TransferState.Canceled, TransferState.Done].includes(state))
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferFinished({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferActive', () => {
        [TransferState.Pending, TransferState.Progress, TransferState.Initializing, TransferState.Finalizing].forEach(
            (state) => {
                it(`should return true for transfer state ${state}`, () => {
                    expect(isTransferActive({ state })).toBeTruthy();
                });
            }
        );

        allStatesList
            .filter(
                (state) =>
                    ![
                        TransferState.Pending,
                        TransferState.Progress,
                        TransferState.Initializing,
                        TransferState.Finalizing,
                    ].includes(state)
            )
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferActive({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferFailed', () => {
        [TransferState.Canceled, TransferState.Error].forEach((state) => {
            it(`should return true for transfer state ${state}`, () => {
                expect(isTransferFailed({ state })).toBeTruthy();
            });
        });

        allStatesList
            .filter((state) => ![TransferState.Canceled, TransferState.Error].includes(state))
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferFailed({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferDone', () => {
        it(`should return true for transfer state ${TransferState.Done}`, () => {
            expect(isTransferDone({ state: TransferState.Done })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Done)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferDone({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferError', () => {
        it(`should return true for transfer state ${TransferState.Error}`, () => {
            expect(isTransferError({ state: TransferState.Error })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Error)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferError({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferCanceled', () => {
        it(`should return true for transfer state ${TransferState.Canceled}`, () => {
            expect(isTransferCanceled({ state: TransferState.Canceled })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Canceled)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferCanceled({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferProgress', () => {
        it(`should return true for transfer state ${TransferState.Progress}`, () => {
            expect(isTransferProgress({ state: TransferState.Progress })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Progress)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferProgress({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferInitializing', () => {
        it(`should return true for transfer state ${TransferState.Initializing}`, () => {
            expect(isTransferInitializing({ state: TransferState.Initializing })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Initializing)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferInitializing({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferPaused', () => {
        it(`should return true for transfer state ${TransferState.Paused}`, () => {
            expect(isTransferPaused({ state: TransferState.Paused })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Paused)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferPaused({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferFinalizing', () => {
        it(`should return true for transfer state ${TransferState.Finalizing}`, () => {
            expect(isTransferFinalizing({ state: TransferState.Finalizing })).toBeTruthy();
        });

        allStatesList
            .filter((state) => state !== TransferState.Finalizing)
            .forEach((state) => {
                it(`should return flase for transfer state ${state}`, () => {
                    expect(isTransferFinalizing({ state })).toBeFalsy();
                });
            });
    });

    describe('isTransferCancelError', () => {
        ['TransferCancel', 'AbortError'].forEach((name) => {
            it(`should return true for error with name ${name}`, () => {
                const error = {
                    name,
                    message: `${name} error accured.`,
                };
                expect(isTransferCancelError(error)).toBeTruthy();
            });
        });

        ['TypeError', 'SyntaxError'].forEach((name) => {
            it(`should return false for error with name ${name}`, () => {
                const error = {
                    name,
                    message: `${name} error accured.`,
                };
                expect(isTransferCancelError(error)).toBeFalsy();
            });
        });
    });

    it(`getMetaForTransfer should map file browser item to trasfer meta`, () => {
        const trasferMeta: TransferMeta = {
            filename: 'Picture.png',
            mimeType: 'image/png',
            size: 1718133,
        };

        const fileBrowserItem: FileBrowserItem = {
            LinkID: 'g5DPgsgSOQhwxfAmy4A-vVIxHd40lH8xRVg_4ulz69pz71x73bSa2QXEbKg151clLRB-CQQTCRNteaIBHL_iUz==',
            MIMEType: trasferMeta.mimeType,
            ModifyTime: 1313241432,
            Name: trasferMeta.filename,
            ParentLinkID: '43wqa2kRVXV1RqnTWI4X9374CLM6D1Pe-f0aletbcMuSZF5sL8L_dcMNgNecuzPO7Tsai08k6SS_ESuZ7vv3d5==',
            Size: trasferMeta.size || 0,
            Trashed: null,
            UrlsExpired: false,
            Type: 2,
            HasThumbnail: false,
        };
        expect(getMetaForTransfer(fileBrowserItem)).toEqual(trasferMeta);
    });

    describe('getProgressBarStatus', () => {
        [
            { state: TransferState.Done, status: ProgressBarStatus.Success },
            { state: TransferState.Canceled, status: ProgressBarStatus.Disabled },
            { state: TransferState.Error, status: ProgressBarStatus.Error },
            { state: TransferState.Finalizing, status: ProgressBarStatus.Running },
            { state: TransferState.Initializing, status: ProgressBarStatus.Running },
            { state: TransferState.Paused, status: ProgressBarStatus.Running },
            { state: TransferState.Pending, status: ProgressBarStatus.Running },
            { state: TransferState.Progress, status: ProgressBarStatus.Running },
        ].forEach(({ state, status }) => {
            it(`should return progress bar status ${status} for transfer state ${state}`, () => {
                expect(getProgressBarStatus(state)).toEqual(status);
            });
        });
    });

    it(`calculateProgress should calculate progress of active trasfers`, () => {
        const size1 = 734003200;
        const size2 = 83404340;
        const progress1 = 279297577;
        const progress2 = 8340324;
        const progress = Math.floor(100 * ((progress1 + progress2) / (size1 + size2 || 1)));
        const latestStats: TransfersStats = {
            stats: {
                'drive-transfers-5740': {
                    speed: 2588514,
                    active: true,
                    progress: progress1,
                },
                'drive-transfers-7456': {
                    speed: 734032,
                    active: false,
                    progress: progress2,
                },
            },
            timestamp: new Date('2021-02-17T17:34:25.031Z'),
        };

        const transfers: Transfer[] = [
            {
                id: 'drive-transfers-5740',
                meta: {
                    size: size1,
                    mimeType: 'application/octet-stream',
                    filename: 'Pregenerated File',
                },
                state: TransferState.Finalizing,
            } as any,
            {
                id: 'drive-transfers-7456',
                meta: {
                    size: size2,
                    mimeType: 'application/octet-stream',
                    filename: 'Pregenerated File 2',
                },
                state: TransferState.Progress,
            } as any,
        ];

        expect(calculateProgress(latestStats, transfers)).toEqual(progress);
    });
});
