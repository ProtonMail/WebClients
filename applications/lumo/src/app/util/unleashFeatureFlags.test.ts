import { getLumoFeatureFlagsForChatCompletions, serializeUnleashToggle } from './unleashFeatureFlags';

jest.mock('@proton/unleash/standaloneClient', () => ({
    getStandaloneUnleashClient: jest.fn(),
}));

const { getStandaloneUnleashClient } = jest.requireMock('@proton/unleash/standaloneClient');

describe('serializeUnleashToggle', () => {
    it('serialises a disabled toggle as false', () => {
        expect(
            serializeUnleashToggle({
                name: 'LumoTooling',
                enabled: false,
                variant: { name: 'disabled' },
            })
        ).toBe('false');
    });

    it('serialises a typical enabled boolean flag as true', () => {
        expect(
            serializeUnleashToggle({
                name: 'LumoTooling',
                enabled: true,
                variant: { name: 'default' },
            })
        ).toBe('true');
    });

    it.each(['LumoAnswerNowQuietThreshold', 'LumoAnswerNowFallback'])(
        'sends the numeric payload of %s without its variant name',
        (name) => {
            expect(
                serializeUnleashToggle({
                    name,
                    enabled: true,
                    variant: { name: 'Config', payload: { value: ' 12 ' } },
                })
            ).toBe('12');
            expect(
                serializeUnleashToggle({
                    name,
                    enabled: false,
                    variant: { name: 'Config', payload: { value: '12' } },
                })
            ).toBe('false');
        }
    );

    it('serialises an A/B variant name when the toggle is on', () => {
        expect(
            serializeUnleashToggle({
                name: 'LumoExperiment',
                enabled: true,
                variant: { name: 'B' },
            })
        ).toBe('B');
    });

    it('serialises payload-only config', () => {
        expect(
            serializeUnleashToggle({
                name: 'LumoConfig',
                enabled: true,
                variant: { name: 'default', payload: { value: '{"limit":10}' } },
            })
        ).toBe('{"limit":10}');
    });

    it('combines variant name and payload when both are meaningful', () => {
        expect(
            serializeUnleashToggle({
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
