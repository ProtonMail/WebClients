import { arrayInterpolate } from './array-interpolate';

type TestEntry = { value: number };
type TestCluster = { max: number };

const shouldInterpolate = (entry: TestEntry, cluster: TestCluster) => entry.value < cluster.max;
const fallbackCluster: TestCluster = { max: 0 };

describe('Items list cluster interpolation', () => {
    test('it should not interpolate on empty entries', () => {
        const result = arrayInterpolate<TestEntry, TestCluster>([], {
            clusters: [{ max: 100 }],
            fallbackCluster,
            shouldInterpolate,
        });

        expect(result.interpolation).toStrictEqual([]);
        expect(result.interpolationIndexes).toEqual([]);
    });

    test('it should only interpolate first cluster if it is the only match', () => {
        const entries: TestEntry[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
        const clusters: TestCluster[] = [{ max: 10 }, { max: 20 }];

        const { interpolation, interpolationIndexes } = arrayInterpolate<TestEntry, TestCluster>(entries, {
            clusters,
            shouldInterpolate,
        });

        expect(interpolation[0]).toEqual({ type: 'interpolation', cluster: clusters[0] });
        expect(interpolation[1]).toEqual({ type: 'entry', entry: entries[0] });
        expect(interpolation[2]).toEqual({ type: 'entry', entry: entries[1] });
        expect(interpolation[3]).toEqual({ type: 'entry', entry: entries[2] });
        expect(interpolationIndexes).toEqual([0]);
    });

    test('it should interpolate last cluster if it is the only match', () => {
        const entries: TestEntry[] = [{ value: 100 }, { value: 101 }, { value: 102 }];
        const clusters: TestCluster[] = [{ max: 10 }, { max: 20 }, { max: 1000 }];

        const { interpolation, interpolationIndexes } = arrayInterpolate<TestEntry, TestCluster>(entries, {
            clusters,
            shouldInterpolate,
        });

        expect(interpolation[0]).toEqual({ type: 'interpolation', cluster: clusters[2] });
        expect(interpolation[1]).toEqual({ type: 'entry', entry: entries[0] });
        expect(interpolation[2]).toEqual({ type: 'entry', entry: entries[1] });
        expect(interpolation[3]).toEqual({ type: 'entry', entry: entries[2] });
        expect(interpolationIndexes).toEqual([0]);
    });

    test('it should interpolate to fallback cluster if there is no match', () => {
        const entries: TestEntry[] = [{ value: 1 }, { value: 2 }, { value: 3 }];
        const clusters: TestCluster[] = [{ max: 0 }];

        const { interpolation, interpolationIndexes } = arrayInterpolate<TestEntry, TestCluster>(entries, {
            clusters,
            fallbackCluster,
            shouldInterpolate,
        });

        expect(interpolation[0]).toEqual({ type: 'interpolation', cluster: fallbackCluster });
        expect(interpolation[1]).toEqual({ type: 'entry', entry: entries[0] });
        expect(interpolation[2]).toEqual({ type: 'entry', entry: entries[1] });
        expect(interpolation[3]).toEqual({ type: 'entry', entry: entries[2] });
        expect(interpolationIndexes).toEqual([0]);
    });

    test('it should interpolate into sub-clusters', () => {
        const entries: TestEntry[] = [{ value: 1 }, { value: 10 }, { value: 11 }, { value: 20 }, { value: 30 }];
        const clusters: TestCluster[] = [{ max: 5 }, { max: 15 }, { max: 25 }, { max: 35 }];

        const { interpolation, interpolationIndexes } = arrayInterpolate<TestEntry, TestCluster>(entries, {
            clusters,
            shouldInterpolate,
        });

        expect(interpolation[0]).toEqual({ type: 'interpolation', cluster: clusters[0] });
        expect(interpolation[1]).toEqual({ type: 'entry', entry: entries[0] });
        expect(interpolation[2]).toEqual({ type: 'interpolation', cluster: clusters[1] });
        expect(interpolation[3]).toEqual({ type: 'entry', entry: entries[1] });
        expect(interpolation[4]).toEqual({ type: 'entry', entry: entries[2] });
        expect(interpolation[5]).toEqual({ type: 'interpolation', cluster: clusters[2] });
        expect(interpolation[6]).toEqual({ type: 'entry', entry: entries[3] });
        expect(interpolation[7]).toEqual({ type: 'interpolation', cluster: clusters[3] });
        expect(interpolation[8]).toEqual({ type: 'entry', entry: entries[4] });
        expect(interpolationIndexes).toEqual([0, 2, 5, 7]);
    });
});
