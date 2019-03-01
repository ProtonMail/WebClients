import updateCollection from '../../helpers/updateCollection';

export const DEFAULT_STATE = {
    loading: false,
    data: []
};

export const createActions = (prefix) => {
    return {
        LOADING: `${prefix}_LOADING`,
        SET: `${prefix}_SET`,
        UPDATE: `${prefix}_UPDATE`,
        RESET: `${prefix}_RESET`
    };
};

export const createReducer = ({ LOADING, SET, RESET, UPDATE }) => {
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

        if (type === UPDATE) {
            return {
                loading: false,
                data: updateCollection(payload, state.data)
            };
        }

        return state;
    };
};
