import { ACTIONS } from './reducer';
import { queryMembers, queryAddresses } from '../../api/members';

export const loadingAction = () => ({ type: ACTIONS.LOADING });
export const resetAction = () => ({ type: ACTIONS.RESET });
export const updateAction = (data) => ({ type: ACTIONS.UPDATE, payload: data });
export const setAction = (data) => ({ type: ACTIONS.SET, payload: data });

export const fetchMembers = () => {
    return async (dispatch, getState, { api }) => {
        dispatch(loadingAction());
        try {
            const { Members = [] } = await api(queryMembers());
            const members = await Promise.all(
                Members.map(async (member) => {
                    const { Addresses = [] } = await api(queryAddresses(member.ID));

                    return {
                        ...member,
                        addresses: Addresses
                    };
                })
            );

            return dispatch(setAction(members));
        } catch (error) {
            dispatch(resetAction());
            throw error;
        }
    };
};
