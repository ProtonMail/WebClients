export const getMeetingLink = (roomId: string) => {
    return `${window.location.origin}/join?room_id=${roomId}`;
};
