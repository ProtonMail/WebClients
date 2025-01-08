import type { OpenAPIV3 } from 'openapi-types';

import { anyTypeParser } from './any';
import type { Content, Path, PathOperation } from './types';
import { refType } from './utils';

/** Checks that a route segment is a parameter */
const isParameter = (segment: string) => segment.startsWith('{') && segment.endsWith('}');

const compareRoutes = (routeA: string, routeB: string) => {
    const segmentsA = routeA.split('/').filter(Boolean);
    const segmentsB = routeB.split('/').filter(Boolean);

    /** If the two routes have different segments length
     * move "longer" routes up top first. This avoids basic
     * route matching swallowing - eg: A should come before B
     * to prevent shorter routes from matching longer routes:
     * A: `api/users/${string}/posts`
     * B: `api/users/${string}` */
    if (segmentsA.length !== segmentsB.length) {
        return segmentsB.length - segmentsA.length;
    }

    /** Then prioritize static segments over dynamic ones.
     * Return early if we find a static vs parameter difference.
     * eg: A should come after B as static is more specific:
     * A: `api/users/${id}`
     * B: `api/users/settings` */
    for (let i = 0; i < segmentsA.length; i++) {
        const isParamA = isParameter(segmentsA[i]);
        const isParamB = isParameter(segmentsB[i]);

        if (!isParamA && isParamB) return -1;
        if (isParamA && !isParamB) return 1;
    }

    /** If routes have the same static/parameter pattern,
     * fall back to alphabetical ordering to ensure
     * consistent sorting of similar routes. */
    return routeA.localeCompare(routeB);
};

const parseContentObject = (object?: Content): string | null => {
    if (!object) return null;
    if ('$ref' in object) return refType(object.$ref);
    else {
        const { content } = object;
        const data = content?.['application/json'] ?? content?.['application/octet-stream'];
        if (!data?.schema) return null;
        return anyTypeParser(data.schema);
    }
};

const parsePaths = (doc: OpenAPIV3.Document): Path[] =>
    Object.entries(doc.paths)
        .sort(([a], [b]) => compareRoutes(a, b))
        .map(([path, methods]) => ({
            path: path.replace(/({.*?}) */g, '${string}').replace(/^\//, ''),
            operations:
                methods ?
                    Object.entries(methods)
                        .map(([method, definition]): PathOperation | null => {
                            if (typeof definition === 'object' && 'responses' in definition) {
                                const responseType = parseContentObject(definition.responses['200']);
                                const requestBodyType = parseContentObject(definition.requestBody);
                                return {
                                    method,
                                    responseType,
                                    requestBodyType,
                                };
                            }

                            return null;
                        })
                        .filter((op): op is PathOperation => Boolean(op))
                :   [],
        }));

const generatePathType = (typeKey: string, paths: Path[], key: keyof PathOperation): string =>
    `export type ${typeKey}<Path extends string, Method extends string> = ${paths
        .map(({ path, operations }) => {
            const members = operations
                .filter((op) => op[key])
                .map((op) => `Method extends \`${op.method}\` ? ${op[key]}`);

            return members.length > 0 ? `Path extends \`${path}\` ? (${members.join(' : ')} : never)` : '';
        })
        .filter(Boolean)
        .join(' : ')} : any;`;

export const generatePaths = (doc: OpenAPIV3.Document): string[] => {
    const paths = parsePaths(doc);
    const responses = generatePathType('ApiResponse', paths, 'responseType');
    const bodys = generatePathType('ApiRequestBody', paths, 'requestBodyType');
    return [responses, bodys];
};
