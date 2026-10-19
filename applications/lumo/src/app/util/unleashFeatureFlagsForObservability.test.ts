import {
    getLumoFeatureFlagsForChatCompletions,
    serializeUnleashToggleForObservability,
} from './unleashFeatureFlagsForObservability';

jest.mock('@proton/unleash/standaloneClient', () => ({
    getStandaloneUnleashClient: jest.fn(),
}));

const { getStandaloneUnleashClient } = jest.requireMock('@proton/unleash/standaloneClient');

describe('serializeUnleashToggleForObservability', () => {
    it('serialises a disabled toggle as false', () => {
        expect(
            serializeUnleashToggleForObservability({
                name: 'LumoTooling',
                enabled: false,
                variant: { name: 'disabled' },
            })
        ).toBe('false');
    });

    it('serialises a typical enabled boolean flag as true', () => {
        expect(
            serializeUnleashToggleForObservability({
                name: 'LumoTooling',
                enabled: true,
                variant: { name: 'default' },
            })
        ).toBe('true');
    });

    it('serialises an A/B variant name when the toggle is on', () => {
        expect(
            serializeUnleashToggleForObservability({
                name: 'LumoExperiment',
                enabled: true,
                variant: { name: 'B' },
            })
        ).toBe('B');
    });

    it('serialises payload-only config', () => {
        expect(
            serializeUnleashToggleForObservability({
                name: 'LumoConfig',
                enabled: true,
                variant: { name: 'default', payload: { value: '{"limit":10}' } },
            })
        ).toBe('{"limit":10}');
    });

    it('combines variant name and payload when both are meaningful', () => {
        expect(
            serializeUnleashToggleForObservability({
                name: 'LumoConfig',
                enabled: true,
                variant: { name: 'Config', payload: { value: '{"limit":10}' } },
            })
        ).toBe('Config|{"limit":10}');
    });
});

describe('getLumoFeatureFlagsForChatCompletions', () => {
    beforeEach(() => {
        getStandaloneUnleashClient.mockReset();
    });

    it('returns only Lumo-prefixed toggles', () => {
        getStandaloneUnleashClient.mockReturnValue({
            getAllToggles: () => [
                { name: 'LumoTooling', enabled: true, variant: { name: 'default' } },
                { name: 'MailFeature', enabled: true, variant: { name: 'default' } },
                { name: 'LumoHighLoad', enabled: false, variant: { name: 'disabled' } },
            ],
        });

        expect(getLumoFeatureFlagsForChatCompletions()).toEqual({
            LumoTooling: 'true',
            LumoHighLoad: 'false',
        });
    });

    it('returns an empty object when Unleash is not initialised', () => {
        getStandaloneUnleashClient.mockReturnValue(undefined);
        expect(getLumoFeatureFlagsForChatCompletions()).toEqual({});
    });
});
