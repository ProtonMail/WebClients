export const getParticipantDisplayColorsByIndex = (index: number) => {
    return {
        profileTextColor: `profile-color-${(index % 6) + 1}`,
        profileColor: `profile-background-${(index % 6) + 1}`,
        backgroundColor: `meet-background-${(index % 6) + 1}`,
        borderColor: `tile-border-${(index % 6) + 1}`,
    };
};
