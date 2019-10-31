import { API_CODES } from '../../constants';

const { ARRAY_GLOBAL_SUCCESS, ARRAY_ELEMENT_SUCCESS } = API_CODES;

interface Response {
    Response: { Code: number };
}

interface Responses {
    Code: number;
    Responses?: Response[];
}

export const allSucceded = ({ Code, Responses = [] }: Responses): boolean => {
    if (Code !== ARRAY_GLOBAL_SUCCESS) {
        return false;
    }
    return !Responses.some(({ Response: { Code } }) => Code !== ARRAY_ELEMENT_SUCCESS);
};
