import { API_CODES } from '../../constants';

const { GLOBAL_SUCCESS, SINGLE_SUCCESS } = API_CODES;

interface Response {
    Response: { Code: number };
}

interface Responses {
    Code: number;
    Responses?: Response[];
}

export const allSucceded = ({ Code, Responses = [] }: Responses): boolean => {
    if (Code !== GLOBAL_SUCCESS) {
        return false;
    }
    return !Responses.some(({ Response: { Code } }) => Code !== SINGLE_SUCCESS);
};
