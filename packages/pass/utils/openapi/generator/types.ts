import type { OpenAPIV3 } from 'openapi-types';

export type Schema = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
export type SchemaRefs = Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>;
export type SchemaEntry = [string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject];
export type SchemaTypeParser = (schema: Schema) => string;
export type Content = OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject | OpenAPIV3.RequestBodyObject;
export type Path = { path: string; operations: PathOperation[] };
export type PathOperation = {
    method: string;
    responseType: string | null;
    requestBodyType: string | null;
};
