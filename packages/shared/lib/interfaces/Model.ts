import { Api } from './Api';

export interface Model<T> {
    key: string;
    get: (api: Api) => T;
    update: (oldModel: T, newModel: Partial<T>) => T;
}
