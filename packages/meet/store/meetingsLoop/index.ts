import type { MeetEventLoopCallback } from '../meetEventLoop/interface';
import { meetingsEventLoopThunk, selectMeetings } from '../slices';

export const meetingsLoop: MeetEventLoopCallback = ({ event, state, dispatch, api }) => {
    if (event.MeetMeetings?.length && selectMeetings(state)?.value) {
        return dispatch(meetingsEventLoopThunk({ event, api }));
    }
};
