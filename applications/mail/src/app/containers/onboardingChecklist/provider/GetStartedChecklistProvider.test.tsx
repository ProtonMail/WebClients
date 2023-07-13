import { useFeature } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { CHECKLIST_DISPLAY_TYPE, ChecklistId, ChecklistKey } from '@proton/shared/lib/interfaces';

import { renderHook } from 'proton-mail/helpers/test/render';

import useChecklist from '../hooks/useChecklist';
import { useGetStartedChecklist } from './GetStartedChecklistProvider';

// TODO delete when cleaning the old checklist
jest.mock('@proton/components/hooks/useFeature');
const mockFeature = useFeature as jest.MockedFunction<any>;

jest.mock('@proton/hooks/useLoading');
const mockLoading = useLoading as jest.MockedFunction<any>;
jest.mock('../hooks/useChecklist');
const mockChecklist = useChecklist as jest.MockedFunction<any>;

interface ChecklistBuilderProps {
    checklistId: ChecklistId;
    isPaid: boolean;
    items?: ChecklistKey[];
    createdAt?: number;
    expiresAt?: number;
    userWasRewarded?: boolean;
    display?: CHECKLIST_DISPLAY_TYPE;
}

const nonAvailableChecklist = {
    Code: 0,
    Items: [] as ChecklistKey[],
    CreatedAt: 0,
    ExpiresAt: 0,
    RewardInGB: 0,
    UserWasRewarded: false,
    Display: CHECKLIST_DISPLAY_TYPE.HIDDEN,
};

const checklistBuilder = ({
    checklistId,
    isPaid,
    items,
    createdAt,
    expiresAt,
    userWasRewarded,
    display,
}: ChecklistBuilderProps) => {
    if (checklistId === 'paying-user' && isPaid) {
        return {
            paidChecklist: [
                {
                    Code: 1000,
                    Items: [...(items || [])],
                    CreatedAt: createdAt || 0,
                    ExpiresAt: expiresAt || 0,
                    RewardInGB: 0,
                    UserWasRewarded: userWasRewarded || false,
                    Display: display || CHECKLIST_DISPLAY_TYPE.HIDDEN,
                },
                false,
            ],
            freeChecklist: [nonAvailableChecklist, false],
        };
    }

    return {
        freeChecklist: [
            {
                Code: 1000,
                Items: [...(items || [])],
                CreatedAt: createdAt || 0,
                ExpiresAt: expiresAt || 0,
                RewardInGB: 0,
                UserWasRewarded: userWasRewarded || false,
                Display: display || CHECKLIST_DISPLAY_TYPE.HIDDEN,
            },
            false,
        ],
        paidChecklist: [nonAvailableChecklist, false],
    };
};

describe('GetStartedChecklistProvider', () => {
    it('Very basic test to see if default return values are correct for free users', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.SendMessage,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);
        mockFeature.mockReturnValue({ feature: { Value: true } });

        const { freeChecklist, paidChecklist } = checklistBuilder({
            checklistId: 'get-started',
            isPaid: false,
            items: itemsList,
        });
        mockChecklist.mockImplementation((checklistId: any) => {
            if (checklistId === 'get-started') {
                return freeChecklist;
            } else {
                return paidChecklist;
            }
        });

        const { result } = await renderHook(() => useGetStartedChecklist());
        const { isUserPaid, loading, isChecklistFinished, userWasRewarded, items, displayState } = result.current;
        expect({ isUserPaid, loading, isChecklistFinished, userWasRewarded, items, displayState }).toStrictEqual({
            isUserPaid: false,
            loading: false,
            isChecklistFinished: false,
            userWasRewarded: false,
            items: new Set([...itemsList]),
            displayState: 'Hidden',
        });
    });

    it('Very basic test to see if default return values are correct for free users', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.MobileApp,
            ChecklistKey.MobileApp,
            ChecklistKey.SendMessage,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);
        mockFeature.mockReturnValue({ feature: { Value: true } });

        const { freeChecklist, paidChecklist } = checklistBuilder({
            checklistId: 'paying-user',
            isPaid: true,
            items: itemsList,
        });
        mockChecklist.mockImplementation((checklistId: any) => {
            if (checklistId === 'get-started') {
                return freeChecklist;
            } else {
                return paidChecklist;
            }
        });

        const { result } = await renderHook(() => useGetStartedChecklist());
        const { isUserPaid, loading, isChecklistFinished, userWasRewarded, items, displayState } = result.current;
        expect({ isUserPaid, loading, isChecklistFinished, userWasRewarded, items, displayState }).toStrictEqual({
            isUserPaid: true,
            loading: false,
            isChecklistFinished: false,
            userWasRewarded: false,
            items: new Set([...itemsList]),
            displayState: 'Hidden',
        });
    });

    it('Test if checklist is marked as finished if all the items are present', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
            ChecklistKey.ProtectInbox,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);
        mockFeature.mockReturnValue({ feature: { Value: true } });

        const { freeChecklist, paidChecklist } = checklistBuilder({
            checklistId: 'get-started',
            isPaid: false,
            items: itemsList,
        });
        mockChecklist.mockImplementation((checklistId: any) => {
            if (checklistId === 'get-started') {
                return freeChecklist;
            } else {
                return paidChecklist;
            }
        });

        const { result } = await renderHook(() => useGetStartedChecklist());
        const { isUserPaid, loading, isChecklistFinished, userWasRewarded, items, displayState } = result.current;
        expect({
            isUserPaid,
            loading,
            isChecklistFinished,
            userWasRewarded,
            items,
            displayState,
        }).toStrictEqual({
            isUserPaid: false,
            loading: false,
            isChecklistFinished: true,
            userWasRewarded: false,
            items: new Set([...itemsList]),
            displayState: 'Hidden',
        });
    });
});
