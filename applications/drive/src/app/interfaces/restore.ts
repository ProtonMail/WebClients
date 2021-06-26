import { RESPONSE_CODE } from '../constants';

export interface RestoreFromTrashResult {
    Responses: { Response: RestoreResponse }[];
}

export interface RestoreResponse {
    Code: RESPONSE_CODE;
    Error?: string;
}
