import { useUserSettings } from '@proton/account/userSettings/hooks';
import { ChecklistType } from '@proton/shared/lib/interfaces';

import { addApiMock, renderHook } from 'proton-mail/helpers/test/helper';

import useChecklist from './useChecklist';

const getChecklist = jest.fn(() => {
    return {
        Code: 10,
        Items: [],
    };
});

const paidChecklist = jest.fn(() => {
    return {
        Code: 20,
        Items: [],
    };
});

const byoeChecklist = jest.fn(() => {
    return {
        Code: 20,
        Items: [],
    };
});

const defaultReturnValue = {
    Code: 0,
    Items: [],
    CreatedAt: 0,
    ExpiresAt: 0,
    UserWasRewarded: false,
    Visible: false,
    Display: 'Hidden',
};

jest.mock('@proton/account/userSettings/hooks');
const mockedUserSettings = useUserSettings as jest.MockedFunction<any>;

describe('useChecklist', () => {
    beforeAll(() => {
        addApiMock(`core/v4/checklist/${ChecklistType.MailFreeUser}`, getChecklist);
        addApiMock(`core/v4/checklist/${ChecklistType.MailPaidUser}`, paidChecklist);
        addApiMock(`core/v4/checklist/${ChecklistType.MailBYOEUser}`, byoeChecklist);
    });

    afterEach(() => {
        getChecklist.mockClear();
        paidChecklist.mockClear();
    });

    it('Should fetch the get-started checklist', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(byoeChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual({ Code: 10, Items: [] });
    });

    it('Should fetch the paying-user checklist', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: ['paying-user'] }]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).toHaveBeenCalled();
        expect(byoeChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual({ Code: 20, Items: [] });
    });

    it('Should fetch the byoe-user checklist', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: ['byoe-user'] }]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(byoeChecklist).toHaveBeenCalled();
        expect(result.current.checklist).toEqual({ Code: 20, Items: [] });
    });

    it('Should not fetch get started when checklist not present', async () => {
        mockedUserSettings.mockReturnValue([{}]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual(defaultReturnValue);
    });

    it('Should not fetch paying user when checklist not present', async () => {
        mockedUserSettings.mockReturnValue([{}]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual(defaultReturnValue);
    });

    it('Should not fetch get started when checklist empty', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: [] }]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual(defaultReturnValue);
    });

    it('Should not fetch paying user when checklist empty', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: [] }]);
        const { result } = await renderHook({ useCallback: () => useChecklist() });

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current.checklist).toEqual(defaultReturnValue);
    });
});
