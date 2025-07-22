export const getMeetingLink = (meetingId: string, password: string) => {
    return `/join/id-${meetingId}#pwd-${password}`;
};
