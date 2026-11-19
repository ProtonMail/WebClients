import { act, fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { DEFAULT_MAIL_SETTINGS, VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import { MailFeatureFlag } from '@proton/unleash/Flags';

import { addApiMock, clearApiMocks } from '../../../../helpers/tests/api';
import { mailTestRender } from '../../../../helpers/tests/render';
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS } from '../../../../telemetry/onboardingEvents';
import ChooseViewLayoutStep, { isChooseViewLayoutStepEligible } from './ChooseViewLayoutStep';

const VIEW_LAYOUT_URL = 'mail/v4/settings/viewlayout';

const mockTracking = {
    trackStepLoaded: jest.fn(),
    trackStepInteracted: jest.fn(),
    trackViewLayoutStepCompleted: jest.fn(),
};
jest.mock('../../../../telemetry/onboardingEvents', () => ({
    ...jest.requireActual('../../../../telemetry/onboardingEvents'),
    useOnboardingTracking: () => mockTracking,
}));

jest.mock('@proton/account/welcomeFlags', () => ({
    ...jest.requireActual('@proton/account/welcomeFlags'),
    useWelcomeFlags: jest.fn(),
}));

const setReplay = (isReplay: boolean) => {
    jest.mocked(useWelcomeFlags).mockReturnValue({
        endReplay: jest.fn(),
        setDone: jest.fn(),
        startReplay: jest.fn(),
        welcomeFlags: { isWelcomeFlow: true, hasGenericWelcomeStep: false, isDone: false, isReplay },
    });
};

const seededState = (ViewLayout: VIEW_LAYOUT) => ({
    mailSettings: getModelState({ ...DEFAULT_MAIL_SETTINGS, ViewLayout }),
});

const mockViewLayoutResponse = () =>
    jest.fn(({ data }: { data: { ViewLayout: VIEW_LAYOUT } }) => ({
        MailSettings: { ...DEFAULT_MAIL_SETTINGS, ViewLayout: data.ViewLayout },
    }));

const click = async (testId: string) => {
    await act(async () => {
        fireEvent.click(screen.getByTestId(testId));
    });
};

const clickNext = async () => {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
};

describe('ChooseViewLayoutStep', () => {
    beforeEach(() => {
        setReplay(false);
    });

    afterEach(() => {
        clearApiMocks();
        jest.clearAllMocks();
    });

    describe('isChooseViewLayoutStepEligible', () => {
        const makeDispatch =
            (unleashClient: unknown) =>
            (thunk: any): any =>
                thunk(jest.fn(), jest.fn(), { unleashClient });

        it('should be gated on the experiment flag the API uses', async () => {
            const isEnabled = jest.fn(() => true);
            const dispatch = makeDispatch({ isEnabled }) as any;

            const { canDisplay, preload } = await isChooseViewLayoutStepEligible(dispatch);

            // Must stay equal to OnboardingLayoutExperimentLogger::FLAG_NAME in Slim-API
            expect(isEnabled).toHaveBeenCalledWith('WebMailOnboardingViewExperiment');
            expect(isEnabled).toHaveBeenCalledWith(MailFeatureFlag.WebMailOnboardingViewExperiment);
            expect(canDisplay).toBe(true);
            expect(preload).toHaveLength(2);
        });

        it('should not display when the feature flag is off', async () => {
            const dispatch = makeDispatch({ isEnabled: () => false }) as any;

            const { canDisplay } = await isChooseViewLayoutStepEligible(dispatch);

            expect(canDisplay).toBe(false);
        });

        it('should not display when the unleash client is unavailable', async () => {
            const dispatch = makeDispatch(undefined) as any;

            const { canDisplay } = await isChooseViewLayoutStepEligible(dispatch);

            expect(canDisplay).toBe(false);
        });
    });

    describe('component', () => {
        it('should pre-select the current layout (ROW)', async () => {
            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.ROW),
            });

            expect(screen.getByTestId('layout:Row')).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByTestId('layout:Column')).toHaveAttribute('aria-pressed', 'false');
            expect(mockTracking.trackStepLoaded).toHaveBeenCalledWith(ONBOARDING_STEPS.viewLayout);
        });

        it('should pre-select the current layout (COLUMN) for a replay user', async () => {
            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.COLUMN),
            });

            expect(screen.getByTestId('layout:Column')).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByTestId('layout:Row')).toHaveAttribute('aria-pressed', 'false');
        });

        it('should only select on click, without saving', async () => {
            const apiSpy = mockViewLayoutResponse();
            addApiMock(VIEW_LAYOUT_URL, apiSpy);

            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.ROW),
            });

            await click('layout:Column');

            expect(apiSpy).not.toHaveBeenCalled();
            expect(screen.getByTestId('layout:Column')).toHaveAttribute('aria-pressed', 'true');
            expect(mockTracking.trackStepInteracted).toHaveBeenCalledWith(
                ONBOARDING_STEPS.viewLayout,
                ONBOARDING_ACTIONS.selectViewLayout
            );
        });

        it('should save the final layout once, with the onboarding source, on Next', async () => {
            const apiSpy = mockViewLayoutResponse();
            addApiMock(VIEW_LAYOUT_URL, apiSpy);
            const onNext = jest.fn();

            const { store } = await mailTestRender(<ChooseViewLayoutStep onNext={onNext} />, {
                preloadedState: seededState(VIEW_LAYOUT.ROW),
            });

            await click('layout:Column');
            await click('layout:Row');
            await click('layout:Column');
            await clickNext();

            expect(apiSpy).toHaveBeenCalledTimes(1);
            expect(apiSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'put',
                    data: { ViewLayout: VIEW_LAYOUT.COLUMN, Source: 'onboarding' },
                })
            );
            expect(store.getState().mailSettings.value?.ViewLayout).toBe(VIEW_LAYOUT.COLUMN);
            expect(onNext).toHaveBeenCalledTimes(1);
        });

        it('should save the default layout too when the user keeps it', async () => {
            const apiSpy = mockViewLayoutResponse();
            addApiMock(VIEW_LAYOUT_URL, apiSpy);

            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.ROW),
            });

            await clickNext();

            expect(apiSpy).toHaveBeenCalledTimes(1);
            expect(apiSpy).toHaveBeenCalledWith(
                expect.objectContaining({ data: { ViewLayout: VIEW_LAYOUT.ROW, Source: 'onboarding' } })
            );
            expect(mockTracking.trackViewLayoutStepCompleted).toHaveBeenCalledWith('row');
        });

        it('should save without the onboarding source on a replay', async () => {
            setReplay(true);
            const apiSpy = mockViewLayoutResponse();
            addApiMock(VIEW_LAYOUT_URL, apiSpy);

            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.COLUMN),
            });

            await clickNext();

            expect(apiSpy).toHaveBeenCalledTimes(1);
            expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ data: { ViewLayout: VIEW_LAYOUT.COLUMN } }));
        });

        it('should not block the flow when the save fails', async () => {
            const apiSpy = jest.fn(() => {
                throw new Error('save failed');
            });
            addApiMock(VIEW_LAYOUT_URL, apiSpy);
            const onNext = jest.fn();

            const { store } = await mailTestRender(<ChooseViewLayoutStep onNext={onNext} />, {
                preloadedState: seededState(VIEW_LAYOUT.ROW),
            });

            await click('layout:Column');
            await clickNext();

            // The store keeps the previous value because the save never succeeded...
            expect(store.getState().mailSettings.value?.ViewLayout).toBe(VIEW_LAYOUT.ROW);
            // ...and the user still advances.
            expect(onNext).toHaveBeenCalledTimes(1);
        });

        it('should send the step_completed telemetry with the chosen layout on Next', async () => {
            addApiMock(VIEW_LAYOUT_URL, mockViewLayoutResponse());

            await mailTestRender(<ChooseViewLayoutStep onNext={jest.fn()} />, {
                preloadedState: seededState(VIEW_LAYOUT.COLUMN),
            });

            await clickNext();

            expect(mockTracking.trackViewLayoutStepCompleted).toHaveBeenCalledWith('column');
        });
    });
});
