import type { OpenAPIV3 } from 'openapi-types';

import { generateObjectTypeBody } from '@proton/pass/utils/openapi/generator/object';

import { generateTSEnum } from './enums';
import type { Schema, SchemaEntry, SchemaTypeParser } from './types';
import { generateSumType, generateUnionType, refType } from './utils';

export const anyTypeParser: SchemaTypeParser = (schema) => {
    if ('$ref' in schema) return refType(schema.$ref);
    if ('enum' in schema) return generateUnionType(schema.enum?.map((val) => `"${val}"`) as string[]);
    if (schema.oneOf) return generateUnionType(schema.oneOf.map(anyTypeParser));
    if (schema.anyOf) return generateSumType(schema.anyOf.map(anyTypeParser));
    if (schema.type === 'array') return `(${anyTypeParser(schema.items)})[]`;
    if (schema.type === 'object') return generateObjectTypeBody(anyTypeParser)(schema, true);
    if (schema.type === 'boolean') return schema.type;
    if (schema.type === 'integer') return 'number';
    if ((schema.type as string) === 'int') return 'number';
    if (schema.type === 'number') return 'number';
    if (schema.type === 'string') return 'string';
    return 'unknown';
};

const generateTSType = (typeKey: string, schema: Schema) => `export type ${typeKey} = ${anyTypeParser(schema)};`;

export const generateType = ([typeKey, schema]: SchemaEntry): string => {
    if ('enum' in schema) return generateTSEnum(typeKey, schema);
    else return generateTSType(typeKey, schema);
};

export const generateTypes = (doc: OpenAPIV3.Document): string => {
    if (!doc.components?.schemas) return '';
    const entries = Object.entries(doc.components.schemas);
    return entries.map(generateType).filter(Boolean).join('\n');
};
