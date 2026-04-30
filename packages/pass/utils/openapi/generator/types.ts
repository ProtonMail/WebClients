import type { OpenAPIV3_1 } from 'openapi-types';

export type Schema = OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;
export type SchemaRefs = Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject>;
export type SchemaEntry = [string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject];
export type SchemaTypeParser = (schema: Schema) => string;
export type Content = OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject | OpenAPIV3_1.RequestBodyObject;
export type Path = { path: string; operations: PathOperation[] };
export type PathOperation = {
    method: string;
    responseType: string | null;
    requestBodyType: string | null;
};
