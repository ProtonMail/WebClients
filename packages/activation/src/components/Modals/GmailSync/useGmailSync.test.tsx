import ReactDOM from 'react-dom';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { easySwitchHookRender } from '@proton/activation/src/tests/render';
import { useExperiment, useFeature, useUserSettings, useWelcomeFlags } from '@proton/components/index';

import useGmailSync from './useGmailSync';

const server = setupServer();

beforeAll(() => {
    // @ts-ignore
    ReactDOM.createPortal = jest.fn((element) => {
        return element;
    });

    server.listen();
    server.use(
        rest.get('/core/v4/features', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/core/v4/experiments', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/core/v4/settings', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.put('/core/v4/settings/welcome', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        })
    );
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

jest.mock('@proton/components/hooks/useFeature');
const mockUseFeature = useFeature as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useUserSettings');
const mockUserSettings = useUserSettings as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useExperiment');
const mockUseExperiment = useExperiment as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useWelcomeFlags');
const mockUseWelcomeFlags = useWelcomeFlags as unknown as jest.MockedFunction<any>;

describe('useGmailSync', () => {
    it('User already saw onboarding, nothing showed', () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'A', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: true }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it('User that have local other than english should not see the animation', () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: true });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: true }]);
        mockUserSettings.mockReturnValue([{ Locale: 'fr_CH' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: true,
            displaySync: false,
        });
    });

    it("User didn't saw onboarding, experiment running, shows default", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'A', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: true,
            displaySync: false,
        });
    });

    it("User didn't saw onboarding, experiment running, shows gmail Forward", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: true,
        });
    });

    it("User didn't saw onboarding, feature disabled", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: false } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it("User didn't saw onboarding, nothing displayed while both are loading", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: true });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: true });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it("User didn't saw onboarding, nothing displayed while feature is loading", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: true });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it("User didn't saw onboarding, nothing displayed while experiment is loading", () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: true });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it('User see gmail forwarding and skip display', () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        result.current.handleSyncSkip();
        const { current } = result;

        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: true,
            displaySync: false,
        });
    });

    it('User see gmail forwarding and successfully forward gmail', async () => {
        const setWelcomeFlagDone = jest.fn();
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }, setWelcomeFlagDone]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        await result.current.handleSyncCallback(false);
        const { current } = result;

        expect(setWelcomeFlagDone).toBeCalledTimes(1);
        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: false,
        });
    });

    it('User see gmail forwarding and had error while forward gmail', () => {
        const setWelcomeFlagDone = jest.fn();
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });
        mockUseExperiment.mockReturnValue({ value: 'B', loading: false });
        mockUseWelcomeFlags.mockReturnValue([{ isDone: false }, setWelcomeFlagDone]);
        mockUserSettings.mockReturnValue([{ Locale: 'en_US' }, false]);

        const { result } = easySwitchHookRender(useGmailSync);
        result.current.handleSyncCallback(true);
        const { current } = result;

        expect(setWelcomeFlagDone).toBeCalledTimes(0);
        expect(current.derivedValues).toStrictEqual({
            displayOnboarding: false,
            displaySync: true,
        });
    });
});
