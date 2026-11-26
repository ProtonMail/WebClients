import { act, renderHook } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import type { OnboardingSurveyPayload } from '@proton/shared/lib/api/onboardingSurvey';
import { useVariant } from '@proton/unleash/useVariant';

import { usePostSignupSurvey } from './usePostSignupSurvey';

vi.mock('@proton/app-context/useApi');
vi.mock('@proton/unleash/useVariant');

const setVariant = (name: string) => vi.mocked(useVariant).mockReturnValue({ name } as any);

const mockApi = vi.fn();

const baseAnswers: Pick<OnboardingSurveyPayload, 'JoinReasons' | 'PreviousProviders'> = {
    JoinReasons: ['private_secure'],
    PreviousProviders: ['gmail'],
};

describe('usePostSignupSurvey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.mockResolvedValue({});
        vi.mocked(useApi).mockReturnValue(mockApi as any);
        setVariant('Treatment1');
    });

    it('keeps the answers of each question', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                HeardFrom: 'friend_family_colleague',
            })
        );
        act(() =>
            result.current.saveAnswers({
                JoinReasons: ['other'],
                JoinReasonDetail: 'details',
                PreviousProviders: ['gmail', 'outlook'],
            })
        );

        expect(result.current.form).toEqual({
            HeardFrom: 'friend_family_colleague',
            JoinReasons: ['other'],
            JoinReasonDetail: 'details',
            PreviousProviders: ['gmail', 'outlook'],
        });
    });

    it('replaces the answer of a question when it is saved again', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                PlannedUse: 'exploring',
            })
        );
        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                PlannedUse: 'work_business',
            })
        );

        expect(result.current.form?.PlannedUse).toBe('work_business');
    });

    it('submits the form as it is, once, silently', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                HeardFrom: 'friend_family_colleague',
            })
        );
        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                JoinReasons: ['new_address'],
            })
        );
        act(() => result.current.submit());
        act(() => result.current.submit());
        act(() => result.current.dismiss());

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockApi).toHaveBeenCalledWith({
            method: 'post',
            url: 'mail/v4/onboarding-survey/submit',
            data: {
                Variant: 'T1',
                HeardFrom: 'friend_family_colleague',
                JoinReasons: ['new_address'],
                PreviousProviders: ['gmail'],
            },
            silence: true,
        });
    });

    it('submits an answer saved right before, in the same handler', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() => {
            result.current.saveAnswers({
                ...baseAnswers,
                PlannedUse: 'main_email',
            });
            result.current.submit();
        });

        expect(mockApi.mock.calls[0][0].data).toEqual({
            Variant: 'T1',
            ...baseAnswers,
            PlannedUse: 'main_email',
        });
    });

    it('reports a dismissal once, without the answers', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                HeardFrom: 'friend_family_colleague',
            })
        );
        act(() => result.current.dismiss());
        act(() => result.current.submit());

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockApi).toHaveBeenCalledWith({
            method: 'post',
            url: 'mail/v4/onboarding-survey/dismiss',
            data: { Variant: 'T1' },
            silence: true,
        });
    });

    it('reports a dismissal even when nothing was answered', () => {
        setVariant('Treatment2');
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() => result.current.dismiss());

        expect(mockApi).toHaveBeenCalledWith({
            method: 'post',
            url: 'mail/v4/onboarding-survey/dismiss',
            data: { Variant: 'T2' },
            silence: true,
        });
    });

    it('does not submit when no question was answered', () => {
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() => result.current.saveAnswers({ JoinReasonDetail: 'details' }));
        act(() => result.current.submit());

        expect(mockApi).not.toHaveBeenCalled();
    });

    it('submits with the arm of the user variant', () => {
        setVariant('Treatment3');
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() => result.current.saveAnswers({ ...baseAnswers, HeardFrom: 'ai_tools' }));
        act(() => result.current.submit());

        expect(mockApi.mock.calls[0][0].data).toEqual({ Variant: 'T3', ...baseAnswers, HeardFrom: 'ai_tools' });
    });

    it.each(['Control', 'disabled'])('reports nothing for the %s variant', (name) => {
        setVariant(name);
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() => result.current.saveAnswers({ ...baseAnswers, HeardFrom: 'ai_tools' }));
        act(() => result.current.submit());
        act(() => result.current.dismiss());

        expect(mockApi).not.toHaveBeenCalled();
    });

    it('never throws when the request fails', () => {
        mockApi.mockRejectedValue(new Error('offline'));
        const { result } = renderHook(() => usePostSignupSurvey());

        act(() =>
            result.current.saveAnswers({
                ...baseAnswers,
                HeardFrom: 'friend_family_colleague',
            })
        );

        expect(() => act(() => result.current.submit())).not.toThrow();
    });
});
