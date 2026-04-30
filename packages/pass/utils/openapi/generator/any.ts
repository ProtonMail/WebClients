import type { OpenAPIV3_1 } from 'openapi-types';

import { generateObjectTypeBody } from '@proton/pass/utils/openapi/generator/object';

import { generateTSEnum } from './enums';
import type { Schema, SchemaEntry, SchemaTypeParser } from './types';
import { generateSumType, generateUnionType, refType } from './utils';

const primitiveToType = (primitive: OpenAPIV3_1.NonArraySchemaObjectType | 'array'): string => {
    switch (primitive) {
        case 'boolean':
            return 'boolean';
        case 'integer':
        case 'number':
        case 'int' as OpenAPIV3_1.NonArraySchemaObjectType:
            return 'number';
        case 'string':
            return 'string';
        case 'null':
            return 'null';
        default:
            return 'unknown';
    }
};

export const anyTypeParser: SchemaTypeParser = (schema) => {
    if ('$ref' in schema) return refType(schema.$ref);
    if ('enum' in schema) return generateUnionType(schema.enum?.map((val) => `"${val}"`) as string[]);
    if (Array.isArray(schema.type)) return generateUnionType(schema.type.map(primitiveToType));
    if (schema.oneOf) return generateUnionType(schema.oneOf.map(anyTypeParser));
    if (schema.anyOf) return generateSumType(schema.anyOf.map(anyTypeParser));
    if (schema.type === 'array') return `(${anyTypeParser(schema.items)})[]`;
    if (schema.type === 'object') return generateObjectTypeBody(anyTypeParser)(schema, true);
    if (typeof schema.type === 'string') return primitiveToType(schema.type);

    return 'unknown';
};

const generateTSType = (typeKey: string, schema: Schema) => `export type ${typeKey} = ${anyTypeParser(schema)};`;

export const generateType = ([typeKey, schema]: SchemaEntry): string => {
    if ('enum' in schema) return generateTSEnum(typeKey, schema);
    else return generateTSType(typeKey, schema);
};

export const generateTypes = (doc: OpenAPIV3_1.Document): string => {
    if (!doc.components?.schemas) return '';
    const entries = Object.entries(doc.components.schemas);
    return entries.map(generateType).filter(Boolean).join('\n');
};
