export const DEFAULT_STATE = {
    loading: false,
    data: undefined
};

export const createActions = (prefix) => {
    return {
        LOADING: `${prefix}_LOADING`,
        SET: `${prefix}_SET`,
        RESET: `${prefix}_RESET`
    };
};

export const createReducer = ({ LOADING, SET, RESET }) => {
    return (state = DEFAULT_STATE, { type, payload }) => {
        if (type === RESET) {
            return DEFAULT_STATE;
        }

        if (type === LOADING) {
            return {
                ...state,
                loading: true
            };
        }

        if (type === SET) {
            return {
                loading: false,
                data: payload
            };
        }

        return state;
    };
};
