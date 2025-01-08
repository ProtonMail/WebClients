import type { OpenAPIV3 } from 'openapi-types';

type EnumDescription = Record<string, string> | undefined;

const generateTSEnumBody = (value: string | number, schema: OpenAPIV3.SchemaObject) => {
    if (schema.type === 'integer') {
        if ('x-enumDescriptions' in schema) {
            const descriptions = schema?.['x-enumDescriptions'] as EnumDescription;
            const key = descriptions?.[value];
            if (key) return `${key.toUpperCase()} = ${value}`;
        }

        return `${(schema.title ?? schema.type).toUpperCase()}_${value} = ${value}`;
    }

    return `${value.toString().toUpperCase()} = "${value}"`;
};

export const generateTSEnum = (typeKey: string, schema: OpenAPIV3.SchemaObject): string => {
    if (schema.enum) {
        const enumBody = schema.enum.map((value: string | number) => generateTSEnumBody(value, schema));
        return `export enum ${typeKey} { ${enumBody.join(',')} };`;
    }

    return '';
};
