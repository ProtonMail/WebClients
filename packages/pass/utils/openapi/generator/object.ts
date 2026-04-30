import type { OpenAPIV3_1 } from 'openapi-types';

import type { Schema, SchemaTypeParser } from './types';
import { generateSumType, generateUnionType, optionalProp, refType, withJSDOC } from './utils';

const generateObjectProp = (
    propName: string,
    typeValue: string,
    propSchema: Schema,
    parentSchema: OpenAPIV3_1.SchemaObject
) => {
    const { required, description } = (() => {
        return {
            required: parentSchema.required?.includes(propName) || '$ref' in propSchema,
            description: propSchema.description ?? '',
        };
    })();

    return withJSDOC(`${optionalProp(propName, !required)}: ${typeValue};`, description);
};

export const generateObjectTypeBody = (anyTypeParser: SchemaTypeParser) => {
    const objectTypeParser = (schema: Schema, wrap: boolean): string => {
        if ('$ref' in schema) return refType(schema.$ref);

        if (schema.allOf) {
            const members = schema.allOf.map((member) => anyTypeParser(member));
            return generateSumType(members);
        }

        if (schema.oneOf) {
            const members = schema.oneOf.map((member) => anyTypeParser(member));
            return generateUnionType(members);
        }

        const properties = Object.entries(schema.properties ?? {});

        const objBody = properties
            .filter(([propName]) => Boolean(propName))
            .map(([propName, propSchema]) => {
                const value = anyTypeParser(propSchema);
                return generateObjectProp(propName, value, propSchema, schema);
            })
            .join('');

        return wrap ? `{ ${objBody} }` : objBody;
    };

    return objectTypeParser;
};
