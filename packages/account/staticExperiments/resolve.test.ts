import { readFeatureFlagCookieEntries, writeFeatureFlagCookieEntries } from '@proton/unleash/UnleashCookiesProvider';

import { resolveStaticExperiments } from './resolve';
import type { StaticExperimentConfig } from './types';

jest.mock('@proton/unleash/UnleashCookiesProvider', () => ({
    ...jest.requireActual('@proton/unleash/UnleashCookiesProvider'),
    readFeatureFlagCookieEntries: jest.fn(),
    writeFeatureFlagCookieEntries: jest.fn(),
}));

const mockedReadEntries = readFeatureFlagCookieEntries as jest.Mock;
const mockedWriteEntries = writeFeatureFlagCookieEntries as jest.Mock;

const buildConfig = (overrides: Partial<StaticExperimentConfig> = {}): StaticExperimentConfig => ({
    enabled: true,
    schedule: [{ startsAt: '1970-01-01T00:00:00Z', weights: { A: 50, B: 50 } }],
    ...overrides,
});

const mockRoll = (value: number) => {
    jest.spyOn(crypto, 'getRandomValues').mockImplementation((buf) => {
        new Uint32Array(buf!.buffer)[0] = value;
        return buf;
    });
};

describe('resolveStaticExperiments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedReadEntries.mockReturnValue(new Map());
        mockRoll(0);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns disabled and clears any existing cookie entry when the experiment is disabled', () => {
        mockedReadEntries.mockReturnValue(new Map([['MyExperiment', 'A']]));

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({ enabled: false }),
        });

        expect(result).toEqual({ MyExperiment: 'disabled' });
        expect(mockedWriteEntries).toHaveBeenCalledWith(new Map());
    });

    it('returns disabled when no schedule entry has started yet', () => {
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2000-01-01T00:00:00Z').getTime());

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [{ startsAt: '2999-01-01T00:00:00Z', weights: { A: 100 } }],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'disabled' });
    });

    it('reuses an existing cookie value if it is still a valid variant', () => {
        mockedReadEntries.mockReturnValue(new Map([['MyExperiment', 'B']]));

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig(),
        });

        expect(result).toEqual({ MyExperiment: 'B' });
        expect(mockedWriteEntries).toHaveBeenCalledWith(new Map([['MyExperiment', 'B']]));
    });

    it('re-rolls when the existing cookie value is not a valid variant for the active weights', () => {
        mockedReadEntries.mockReturnValue(new Map([['MyExperiment', 'C']]));
        mockRoll(10);

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig(),
        });

        expect(result).toEqual({ MyExperiment: 'A' });
    });

    it('rolls a new variant proportionally to the active weights', () => {
        mockRoll(30);

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [{ startsAt: '1970-01-01T00:00:00Z', weights: { A: 20, B: 30, C: 4 } }],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'B' });
        expect(mockedWriteEntries).toHaveBeenCalledWith(new Map([['MyExperiment', 'B']]));
    });

    it('picks the latest due schedule entry, ignoring ones that have not started yet', () => {
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2020-06-01T00:00:00Z').getTime());

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [
                    { startsAt: '1970-01-01T00:00:00Z', weights: { A: 100 } },
                    { startsAt: '2020-01-01T00:00:00Z', weights: { B: 100 } },
                    { startsAt: '2999-01-01T00:00:00Z', weights: { C: 100 } },
                ],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'B' });
    });

    it('returns disabled once the only schedule entry has ended', () => {
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2020-06-01T00:00:00Z').getTime());

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [{ startsAt: '1970-01-01T00:00:00Z', endsAt: '2020-01-01T00:00:00Z', weights: { A: 100 } }],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'disabled' });
    });

    it('falls back to an earlier still-active entry once a later entry has ended', () => {
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2020-06-01T00:00:00Z').getTime());

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [
                    { startsAt: '1970-01-01T00:00:00Z', weights: { A: 100 } },
                    { startsAt: '2020-01-01T00:00:00Z', endsAt: '2020-02-01T00:00:00Z', weights: { B: 100 } },
                ],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'A' });
    });

    it('treats an entry as active up to but not including its endsAt', () => {
        const endsAt = '2020-01-01T00:00:00Z';
        jest.spyOn(Date, 'now').mockReturnValue(new Date(endsAt).getTime());

        const result = resolveStaticExperiments({
            MyExperiment: buildConfig({
                schedule: [{ startsAt: '1970-01-01T00:00:00Z', endsAt, weights: { A: 100 } }],
            }),
        });

        expect(result).toEqual({ MyExperiment: 'disabled' });
    });

    it('preserves unrelated cookie entries when writing back', () => {
        mockedReadEntries.mockReturnValue(new Map([['OtherFlag', 'X']]));
        jest.spyOn(Date, 'now').mockReturnValue(0);

        resolveStaticExperiments({
            MyExperiment: buildConfig({ schedule: [{ startsAt: '1970-01-01T00:00:00Z', weights: { A: 100 } }] }),
        });

        expect(mockedWriteEntries).toHaveBeenCalledWith(
            new Map([
                ['OtherFlag', 'X'],
                ['MyExperiment', 'A'],
            ])
        );
    });

    it('resolves multiple experiments in a single read/write pass', () => {
        mockedReadEntries.mockReturnValue(new Map());
        jest.spyOn(Date, 'now').mockReturnValue(0);

        const result = resolveStaticExperiments({
            ExperimentA: buildConfig({ schedule: [{ startsAt: '1970-01-01T00:00:00Z', weights: { A: 100 } }] }),
            ExperimentB: buildConfig({ enabled: false }),
        });

        expect(result).toEqual({ ExperimentA: 'A', ExperimentB: 'disabled' });
        expect(mockedReadEntries).toHaveBeenCalledTimes(1);
        expect(mockedWriteEntries).toHaveBeenCalledTimes(1);
    });
});
