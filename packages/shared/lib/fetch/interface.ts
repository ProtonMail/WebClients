import type { FetchDataType } from './serialize';

export type ResponseDataType = 'blob' | 'raw' | 'json' | 'text' | 'stream' | 'arrayBuffer';
export type FetchConfigMethod = 'post' | 'put' | 'patch' | 'delete' | 'get';

export interface FetchConfig extends Omit<RequestInit, 'mode' | 'credentials' | 'redirect'> {
    url: string;
    method?: FetchConfigMethod | string /* string to allow our config functions */;
    params?: { [key: string]: string | number };
    data?: { [key: string]: any };
    input?: FetchDataType;
    output?: ResponseDataType;
    suppress?: number[];
    silence?: boolean;
    timeout?: number;
    ignoreHandler?: number[];
}
