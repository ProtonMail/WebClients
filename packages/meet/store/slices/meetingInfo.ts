// TODO(follow-up): migrate the remaining importers to './currentMeeting' and delete this file
export * from './currentMeeting';
export {
    setCurrentMeeting as setMeetingInfo,
    resetCurrentMeeting as resetMeetingInfo,
    selectCurrentMeeting as selectMeetingInfo,
    currentMeetingReducer as meetingInfoReducer,
} from './currentMeeting';
export type { CurrentMeetingState as MeetingInfoState } from './currentMeeting';
