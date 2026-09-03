import fs from 'fs';
import path from 'path';

/**
 * Every feature carries a stable `id` that render sites use as the React key, so two
 * different features must never answer to the same one. This walks the feature configs
 * rather than calling the builders, because most of them need plan data to run.
 */

/** Ids that more than one builder is allowed to produce, with the reason. */
const SHARED_IDS: Record<string, string> = {
    // getB2BHighSpeedVPNConnectionsFeature and getB2BHighSpeedVPNConnections return the
    // same feature; they should be collapsed into one builder.
    'b2b-high-speed-vpn-connections': 'duplicate builders, pending cleanup',
};

const FEATURES_DIR = __dirname;

const getBuildersById = () => {
    const buildersById = new Map<string, Set<string>>();

    const files = fs
        .readdirSync(FEATURES_DIR)
        .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.') && file !== 'interface.ts');

    for (const file of files) {
        let builder = '(top level)';

        for (const line of fs.readFileSync(path.join(FEATURES_DIR, file), 'utf8').split('\n')) {
            const declaration = /^(?:export )?const (\w+) = /.exec(line);
            if (declaration) {
                builder = declaration[1];
            }

            const id = /^\s*id: '([^']+)',/.exec(line);
            if (id) {
                const builders = buildersById.get(id[1]) ?? new Set();
                builders.add(`${file}:${builder}`);
                buildersById.set(id[1], builders);
            }
        }
    }

    return buildersById;
};

describe('feature ids', () => {
    const buildersById = getBuildersById();

    it('covers every feature config', () => {
        // A guard against the scan silently matching nothing after a refactor.
        expect(buildersById.size).toBeGreaterThan(150);
    });

    it('are not shared by two different builders', () => {
        const shared = [...buildersById.entries()]
            .filter(([id, builders]) => builders.size > 1 && !SHARED_IDS[id])
            .map(([id, builders]) => `${id}: ${[...builders].join(', ')}`);

        expect(shared).toEqual([]);
    });

    it('are kebab-case', () => {
        const malformed = [...buildersById.keys()].filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id));

        expect(malformed).toEqual([]);
    });
});
