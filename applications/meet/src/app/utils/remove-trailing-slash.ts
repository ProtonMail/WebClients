export const removeTrailingSlash = (meetingLinkName: string) => {
    return meetingLinkName.at(-1) === '/' ? meetingLinkName.slice(0, -1) : meetingLinkName;
};
