import type { MaybeNull } from '@proton/pass/types';

export type InterpolationItem<Value, Cluster> =
    | { type: 'entry'; entry: Value }
    | { type: 'interpolation'; cluster: Cluster };

export type Interpolation<Value, Cluster> = {
    clusters: Cluster[];
    interpolated: boolean;
    interpolation: InterpolationItem<Value, Cluster>[];
    interpolationIndexes: number[];
};

type InterpolationOptions<T, Cluster> = {
    clusters: Cluster[];
    shouldInterpolate: (entry: T, cluster: Cluster) => boolean;
    fallbackCluster?: Cluster;
};

/* Returns an interpolated array based on clusters and
 * interpolation rules. Interpolations are between adjacent
 * clusters where "shouldInterpolate" is true. `entries` &
 * `clusters` must be sorted for best results. */
export const arrayInterpolate = <Value, Cluster>(
    entries: Value[],
    { clusters, shouldInterpolate, fallbackCluster }: InterpolationOptions<Value, Cluster>
): Interpolation<Value, Cluster> => {
    const initial: Interpolation<Value, Cluster> = {
        interpolation: [],
        interpolationIndexes: [],
        interpolated: false,
        clusters,
    };

    return entries.reduce<Interpolation<Value, Cluster>>((acc, entry) => {
        if (acc.clusters.length === 0) {
            acc.interpolation.push({ type: 'entry', entry });
            return acc;
        }

        const cluster = acc.clusters[0];

        let interpolate: MaybeNull<Cluster> = null;

        if (shouldInterpolate(entry, cluster)) {
            interpolate = !acc.interpolated ? cluster : null;
        } else {
            const rest = acc.clusters.slice(1);
            const nextClusterIdx = rest.findIndex((_cluster) => shouldInterpolate(entry, _cluster));
            const nextCluster = rest?.[nextClusterIdx];

            acc.clusters = nextCluster ? rest.slice(nextClusterIdx) : [];
            interpolate = nextCluster ?? fallbackCluster ?? null;
        }

        if (interpolate) {
            acc.interpolated = true;
            acc.interpolation.push({ type: 'interpolation', cluster: interpolate });
            acc.interpolationIndexes.push(acc.interpolation.length - 1);
        }

        acc.interpolation.push({ type: 'entry', entry });

        return acc;
    }, initial);
};
