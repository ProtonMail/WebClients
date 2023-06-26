import { useUserSettings } from '@proton/components/hooks';

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

const defaultReturnValue = {
    Code: 0,
    Items: [],
    CreatedAt: 0,
    ExpiresAt: 0,
    UserWasRewarded: false,
    Display: 'Hidden',
};

jest.mock('@proton/components/hooks/useUserSettings');
const mockedUserSettings = useUserSettings as jest.MockedFunction<any>;

describe('useChecklist', () => {
    beforeAll(() => {
        addApiMock(`core/v4/checklist/get-started`, getChecklist);
        addApiMock(`core/v4/checklist/paying-user`, paidChecklist);
    });

    afterEach(() => {
        getChecklist.mockClear();
        paidChecklist.mockClear();
    });

    it('Should fetch the get-started checklist', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);
        const { result } = await renderHook(() => useChecklist('get-started'));

        expect(getChecklist).toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current[0]).toEqual({ Code: 10, Items: [] });
    });

    it('Should fetch the paying-user checklist', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: ['paying-user'] }]);
        const { result } = await renderHook(() => useChecklist('paying-user'));

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).toHaveBeenCalled();
        expect(result.current[0]).toEqual({ Code: 20, Items: [] });
    });

    it('Should not fetch get started when checklist not present', async () => {
        mockedUserSettings.mockReturnValue([{}]);
        const { result } = await renderHook(() => useChecklist('get-started'));

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current[0]).toEqual(defaultReturnValue);
    });

    it('Should not fetch paying user when checklist not present', async () => {
        mockedUserSettings.mockReturnValue([{}]);
        const { result } = await renderHook(() => useChecklist('paying-user'));

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current[0]).toEqual(defaultReturnValue);
    });

    it('Should not fetch get started when checklist empty', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: [] }]);
        const { result } = await renderHook(() => useChecklist('get-started'));

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current[0]).toEqual(defaultReturnValue);
    });

    it('Should not fetch paying user when checklist empty', async () => {
        mockedUserSettings.mockReturnValue([{ Checklists: [] }]);
        const { result } = await renderHook(() => useChecklist('paying-user'));

        expect(getChecklist).not.toHaveBeenCalled();
        expect(paidChecklist).not.toHaveBeenCalled();
        expect(result.current[0]).toEqual(defaultReturnValue);
    });
});
