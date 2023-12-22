import { Logical } from '../Logical';

export const normalizeName = (server: Logical): string => {
    let name = server.Name.toLowerCase()
        .replace(/[^a-zA-Z0-9.#-]/g, '')
        .replace(/[#.-]+/g, '-')
        .replace(/^[\s-]+/g, '')
        .replace(/[\s-]+$/g, '');

    if (name) {
        let needsFreeSuffix = server.Tier === 0 && name.indexOf('-free') === -1;

        name = name.replace(/^([a-zA-Z]{2}-)((?:[a-zA-Z]{2}-)?)(\d+)$/, (_, start, middle, end) => {
            if (needsFreeSuffix) {
                middle += 'free-';
            }

            needsFreeSuffix = false;

            return start + middle + end.padStart(2, '0');
        });

        if (needsFreeSuffix) {
            name += '-free';
        }
    }

    return name;
};
