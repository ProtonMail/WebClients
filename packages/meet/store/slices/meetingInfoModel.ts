import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice, miniSerializeError } from '@reduxjs/toolkit';

import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseMapStore } from '@proton/redux-utilities/promiseStore';
import { SECOND } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';

import type { SRPHandshakeInfo } from '../../api/meetSrpRequests';
import { requestHandshakeInfo, requestMeetingInfo, requestSessionToken } from '../../api/meetSrpRequests';
import { decryptMeetingName } from '../../utils/cryptoUtils';
import type { MeetExtraThunkArguments } from '../store';

const name = 'meetingInfoModel' as const;

export type ServerMeetingInfo = MeetingInfoResponse['MeetingInfo'];

export interface MeetingInfoModel {
    meetingLinkName: string;
    meetingInfo: ServerMeetingInfo;
    meetingName: string;
}

export interface MeetingInfoModelState {
    [name]: ModelState<MeetingInfoModel>;
}

const initialState = getInitialModelState<MeetingInfoModel>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<MeetingInfoModel>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action: PayloadAction<any>) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        resetMeetingInfoModel: () => initialState,
    },
});

export const selectMeetingInfoModel = (state: MeetingInfoModelState) => state[name];

const selectModelForMeeting = (state: MeetingInfoModelState, meetingLinkName: string) => {
    const model = selectMeetingInfoModel(state);

    return model.value?.meetingLinkName === meetingLinkName ? model : undefined;
};

const decryptAndBuildModel = async ({
    api,
    meetingLinkName,
    meetingPassword,
    silence,
}: {
    api: Api;
    meetingLinkName: string;
    meetingPassword: string;
    silence?: number[];
}): Promise<MeetingInfoModel> => {
    const { MeetingInfo } = await requestMeetingInfo(api, meetingLinkName, silence);

    const meetingName = await decryptMeetingName({
        password: meetingPassword,
        encryptedSessionKey: MeetingInfo.SessionKey,
        encryptedMeetingName: MeetingInfo.MeetingName,
        salt: MeetingInfo.Salt,
    });

    return { meetingLinkName, meetingInfo: MeetingInfo, meetingName };
};

const establishMeetingSession = async ({
    api,
    uid,
    meetingLinkName,
    meetingPassword,
    handshakeInfo,
    cryptoReady,
}: {
    api: Api;
    uid?: string;
    meetingLinkName: string;
    meetingPassword: string;
    handshakeInfo?: SRPHandshakeInfo;
    cryptoReady?: Promise<unknown>;
}) => {
    const [resolvedHandshakeInfo] = await Promise.all([
        handshakeInfo ?? requestHandshakeInfo(api, meetingLinkName),
        cryptoReady,
    ]);

    await requestSessionToken(api, {
        token: meetingLinkName,
        password: meetingPassword,
        handshakeInfo: resolvedHandshakeInfo,
        uid,
    });
};

export interface MeetingInfoThunkOptions {
    meetingLinkName: string;
    meetingPassword: string;
    handshakeInfo?: SRPHandshakeInfo;
    cryptoReady?: Promise<unknown>;
    cache?: CacheType;
}

const promiseStore = createPromiseMapStore<MeetingInfoModel>();

const runWithModelDispatch = async (
    dispatch: (action: UnknownAction) => unknown,
    fetchModel: () => Promise<MeetingInfoModel>
) => {
    try {
        dispatch(slice.actions.pending());

        const value = await fetchModel();

        dispatch(slice.actions.fulfilled(value));

        return value;
    } catch (error) {
        dispatch(slice.actions.rejected(miniSerializeError(error)));

        throw error;
    }
};

export const meetingInfoThunk = ({
    meetingLinkName,
    meetingPassword,
    handshakeInfo,
    cryptoReady,
    cache,
}: MeetingInfoThunkOptions): ThunkAction<
    Promise<MeetingInfoModel>,
    MeetingInfoModelState,
    MeetExtraThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState, extraArgument) => {
        const { api, authentication } = extraArgument;

        const select = () => selectModelForMeeting(getState(), meetingLinkName);

        const cb = () =>
            runWithModelDispatch(dispatch, async () => {
                await establishMeetingSession({
                    api,
                    uid: authentication.UID,
                    meetingLinkName,
                    meetingPassword,
                    handshakeInfo,
                    cryptoReady,
                });

                return decryptAndBuildModel({ api, meetingLinkName, meetingPassword });
            });

        return cacheHelper({ store: promiseStore, key: meetingLinkName, select, cb, cache });
    };
};

/**
 * Re-reads the meeting info once the meeting session is already established, so it skips the SRP
 * handshake. Needed right after joining because ExpirationTime only exists once the meeting started.
 */
export const refreshMeetingInfoThunk = ({
    meetingLinkName,
    meetingPassword,
    silence,
}: {
    meetingLinkName: string;
    meetingPassword: string;
    silence?: number[];
}): ThunkAction<Promise<MeetingInfoModel>, MeetingInfoModelState, MeetExtraThunkArguments, UnknownAction> => {
    return (dispatch, getState, { api }) => {
        const cb = () =>
            runWithModelDispatch(dispatch, () =>
                decryptAndBuildModel({ api, meetingLinkName, meetingPassword, silence })
            );

        return cacheHelper({
            store: promiseStore,
            key: `${meetingLinkName}:refresh`,
            select: () => undefined,
            cb,
            cache: CacheType.None,
        });
    };
};

const selectValue = (state: MeetingInfoModelState) => selectMeetingInfoModel(state).value;

export const selectMaxParticipants = (state: MeetingInfoModelState) =>
    selectValue(state)?.meetingInfo.MaxParticipants ?? 0;
export const selectMaxDuration = (state: MeetingInfoModelState) => selectValue(state)?.meetingInfo.MaxDuration ?? 0;
export const selectExpirationTime = (state: MeetingInfoModelState) => {
    const expirationTime = selectValue(state)?.meetingInfo.ExpirationTime;

    return expirationTime ? SECOND * expirationTime : null;
};

export const { resetMeetingInfoModel } = slice.actions;

export const meetingInfoModelReducer = { [name]: slice.reducer };
