import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { ALMOST_ALL_MAIL, SHORTCUTS, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import { mockUseHistory, mockUseMailSettings } from '@proton/testing';

import { useFolderNavigationHotkeys } from './useFolderNavigationHotkeys';

jest.mock('@proton/shared/lib/shortcuts/helpers', () => ({ __esModule: true, isBusy: jest.fn(() => false) }));

const event = {
    stopPropagation: jest.fn(),
    preventDefault: jest.fn(),
} as unknown as KeyboardEvent;

describe('useFolderNavigationHotkeys', () => {
    const mockedPush = jest.fn();
    beforeEach(() => {
        mockUseHistory({ push: mockedPush });
        mockUseMailSettings([{ Shortcuts: 1 }]);
    });

    afterEach(() => {
        mockedPush.mockClear();
    });

    it('should return correct helper', () => {
        const shortcuts = useFolderNavigationHotkeys();
        expect(shortcuts).toHaveLength(8);

        const firstShortCut = shortcuts[0];
        expect(firstShortCut).toStrictEqual(['G', 'I', expect.anything()]);
        (firstShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/inbox');
        mockedPush.mockClear();

        const secondShortCut = shortcuts[1];
        expect(secondShortCut).toStrictEqual(['G', 'D', expect.anything()]);
        (secondShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/drafts');
        mockedPush.mockClear();

        const thirdShortCut = shortcuts[2];
        expect(thirdShortCut).toStrictEqual(['G', 'E', expect.anything()]);
        (thirdShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/sent');
        mockedPush.mockClear();

        const fourthShortCut = shortcuts[3];
        expect(fourthShortCut).toStrictEqual(['G', KeyboardKey.Star, expect.anything()]);
        (fourthShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/starred');
        mockedPush.mockClear();

        const fifthShortCut = shortcuts[4];
        expect(fifthShortCut).toStrictEqual(['G', 'A', expect.anything()]);
        (fifthShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/archive');
        mockedPush.mockClear();

        const sixthShortCut = shortcuts[5];
        expect(sixthShortCut).toStrictEqual(['G', 'S', expect.anything()]);
        (sixthShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/spam');
        mockedPush.mockClear();

        const seventhShortCut = shortcuts[6];
        expect(seventhShortCut).toStrictEqual(['G', 'T', expect.anything()]);
        (seventhShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/trash');
        mockedPush.mockClear();

        const eigthShortCut = shortcuts[7];
        expect(eigthShortCut).toStrictEqual(['G', 'M', expect.anything()]);
        (eigthShortCut[2] as (e: KeyboardEvent) => void)(event);
        expect(mockedPush).toHaveBeenCalledTimes(1);
        expect(mockedPush).toHaveBeenCalledWith('/all-mail');
        mockedPush.mockClear();
    });

    describe('when shortcut is set to false', () => {
        it('should return no shortcut', () => {
            mockUseMailSettings([{ Shortcuts: SHORTCUTS.DISABLED }]);
            const shortcuts = useFolderNavigationHotkeys();
            expect(shortcuts).toHaveLength(0);
        });
    });

    describe('when ShowMoved is true', () => {
        it('should navigate to correct url', () => {
            mockUseMailSettings([{ Shortcuts: SHORTCUTS.ENABLED, ShowMoved: SHOW_MOVED.DRAFTS }]);
            const shortcuts = useFolderNavigationHotkeys();
            expect(shortcuts).toHaveLength(8);

            const secondShortCut = shortcuts[1];
            expect(secondShortCut).toStrictEqual(['G', 'D', expect.anything()]);
            (secondShortCut[2] as (e: KeyboardEvent) => void)(event);
            expect(mockedPush).toHaveBeenCalledTimes(1);
            expect(mockedPush).toHaveBeenCalledWith('/all-drafts');
            mockedPush.mockClear();
        });
    });

    describe('when AlmostAllMail is true', () => {
        it('should navigate to correct url', () => {
            mockUseMailSettings([{ Shortcuts: SHORTCUTS.ENABLED, AlmostAllMail: ALMOST_ALL_MAIL.ENABLED }]);
            const shortcuts = useFolderNavigationHotkeys();
            expect(shortcuts).toHaveLength(8);

            const eigthShortCut = shortcuts[7];
            expect(eigthShortCut).toStrictEqual(['G', 'M', expect.anything()]);
            (eigthShortCut[2] as (e: KeyboardEvent) => void)(event);
            expect(mockedPush).toHaveBeenCalledTimes(1);
            expect(mockedPush).toHaveBeenCalledWith('/almost-all-mail');
            mockedPush.mockClear();
        });
    });
});
