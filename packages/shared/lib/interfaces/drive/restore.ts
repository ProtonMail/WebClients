import { RESPONSE_CODE } from '../../drive/constants';

export interface RestoreFromTrashResult {
    Responses: { Response: RestoreResponse }[];
}

export interface RestoreResponse {
    Code: RESPONSE_CODE;
    Error?: string;
}
