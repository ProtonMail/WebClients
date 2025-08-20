import { describe } from '@jest/globals';

import { getModelState } from '@proton/account/test';
import useLoading from '@proton/hooks/useLoading';
import type {
    ChecklistId,
    UserModel} from '@proton/shared/lib/interfaces';
import {
    CHECKLIST_DISPLAY_TYPE,
    ChecklistKey,
    ChecklistType
} from '@proton/shared/lib/interfaces';

import { renderHook } from 'proton-mail/helpers/test/render';

import useChecklist from '../hooks/useChecklist';
import { getMailChecklistItemsToComplete, useGetStartedChecklist } from './GetStartedChecklistProvider';

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
            Code: 1000,
            Items: [...(items || [])],
            CreatedAt: createdAt || 0,
            ExpiresAt: expiresAt || 0,
            RewardInGB: 0,
            UserWasRewarded: userWasRewarded || false,
            Display: display || CHECKLIST_DISPLAY_TYPE.HIDDEN,
        };
    }

    return {
        Code: 1000,
        Items: [...(items || [])],
        CreatedAt: createdAt || 0,
        ExpiresAt: expiresAt || 0,
        RewardInGB: 0,
        UserWasRewarded: userWasRewarded || false,
        Display: display || CHECKLIST_DISPLAY_TYPE.HIDDEN,
    };
};

describe('GetStartedChecklistProvider', () => {
    it('should return correct default values for free users', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.SendMessage,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);

        const checklist = checklistBuilder({
            checklistId: 'get-started',
            isPaid: false,
            items: itemsList,
        });
        mockChecklist.mockImplementation(() => ({
            checklist,
            loading: false,
            checklistType: ChecklistType.MailFreeUser,
        }));

        const { result } = await renderHook({
            useCallback: () => useGetStartedChecklist(),
            preloadedState: {
                user: getModelState({
                    hasPaidMail: false,
                    Flags: { 'has-a-byoe-address': false },
                } as UserModel),
            },
        });
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

    it('should return correct default values for paid users', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.MobileApp,
            ChecklistKey.MobileApp,
            ChecklistKey.SendMessage,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);

        const checklist = checklistBuilder({
            checklistId: 'paying-user',
            isPaid: true,
            items: itemsList,
        });
        mockChecklist.mockImplementation(() => ({
            checklist,
            loading: false,
            checklistType: ChecklistType.MailPaidUser,
        }));

        const { result } = await renderHook({
            useCallback: () => useGetStartedChecklist(),
            preloadedState: {
                user: getModelState({
                    hasPaidMail: true,
                    Flags: { 'has-a-byoe-address': false },
                } as UserModel),
            },
        });
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

    it('should return correct default values for free BYOE users', async () => {
        const itemsList = [ChecklistKey.MobileApp, ChecklistKey.SendMessage, ChecklistKey.ClaimAddress];

        mockLoading.mockReturnValue([false, jest.fn()]);

        const checklist = checklistBuilder({
            checklistId: 'byoe-user',
            isPaid: false,
            items: itemsList,
        });
        mockChecklist.mockImplementation(() => ({
            checklist,
            loading: false,
            checklistType: ChecklistType.MailBYOEUser,
        }));

        const { result } = await renderHook({
            useCallback: () => useGetStartedChecklist(),
            preloadedState: {
                user: getModelState({
                    hasPaidMail: false,
                    Flags: { 'has-a-byoe-address': true },
                } as UserModel),
            },
        });
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

    it('Test if checklist is marked as finished if all the items are present', async () => {
        const itemsList = [
            ChecklistKey.MobileApp,
            ChecklistKey.Import,
            ChecklistKey.AccountLogin,
            ChecklistKey.ProtectInbox,
        ];

        mockLoading.mockReturnValue([false, jest.fn()]);

        const checklist = checklistBuilder({
            checklistId: 'get-started',
            isPaid: false,
            items: itemsList,
        });
        mockChecklist.mockImplementation(() => ({
            checklist,
            loading: false,
            checklistType: ChecklistType.MailFreeUser,
        }));

        const { result } = await renderHook({
            useCallback: () => useGetStartedChecklist(),
            preloadedState: {
                user: getModelState({
                    hasPaidMail: false,
                    Flags: { 'has-a-byoe-address': false },
                } as UserModel),
            },
        });
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

    describe('getMailChecklistItemsToComplete', () => {
        it('should return an empty list of tasks when checklist type is not defined', () => {
            expect(getMailChecklistItemsToComplete(undefined)).toEqual([]);
        });

        it('should return the regular list of task for an internal user', () => {
            expect(getMailChecklistItemsToComplete(ChecklistType.MailFreeUser)).toEqual([
                ChecklistKey.AccountLogin,
                ChecklistKey.Import,
                ChecklistKey.ProtectInbox,
                ChecklistKey.MobileApp,
            ]);
            expect(getMailChecklistItemsToComplete(ChecklistType.MailPaidUser)).toEqual([
                ChecklistKey.AccountLogin,
                ChecklistKey.Import,
                ChecklistKey.ProtectInbox,
                ChecklistKey.MobileApp,
            ]);
        });

        it('should return the bype list of tasks for a byoe user', () => {
            expect(getMailChecklistItemsToComplete(ChecklistType.MailBYOEUser)).toEqual([
                ChecklistKey.ProtectInbox,
                ChecklistKey.MobileApp,
                ChecklistKey.ClaimAddress,
            ]);
        });
    });
});
