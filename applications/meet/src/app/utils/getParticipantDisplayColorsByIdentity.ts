function stableColorIndex(identity: string): number {
    let hash = 0;
    for (let i = 0; i < identity.length; i++) {
        hash = ((hash << 5) - hash + identity.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 6;
}
export const getParticipantDisplayColorsByIdentity = (identity: string | undefined) => {
    if (!identity) {
        return {
            profileTextColor: 'profile-color-1',
            profileColor: 'profile-background-1',
            backgroundColor: 'meet-background-1',
            borderColor: 'tile-border-1',
        };
    }

    const index = stableColorIndex(identity);

    return {
        profileTextColor: `profile-color-${index + 1}`,
        profileColor: `profile-background-${index + 1}`,
        backgroundColor: `meet-background-${index + 1}`,
        borderColor: `tile-border-${index + 1}`,
    };
};
