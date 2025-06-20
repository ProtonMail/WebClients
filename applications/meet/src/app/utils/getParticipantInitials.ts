export const getParticipantInitials = (participantName: string) => {
    if (!participantName) {
        return 'NA';
    }

    const nameParts = participantName.split(' ');

    return `${nameParts?.[0]?.charAt(0)?.toLocaleUpperCase()}${nameParts?.[1]?.charAt(0)?.toLocaleUpperCase() ?? ''}`;
};
