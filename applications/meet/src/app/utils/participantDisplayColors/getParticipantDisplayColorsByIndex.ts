export const getParticipantDisplayColorsByIndex = (colorIndex: number) => ({
    profileTextColor: `profile-color-${colorIndex + 1}`,
    profileColor: `profile-background-${colorIndex + 1}`,
    backgroundColor: `meet-background-${colorIndex + 1}`,
    borderColor: `tile-border-${colorIndex + 1}`,
});
