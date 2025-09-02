export const parseMeetingLink = (link: string) => {
    const parts = link.split('#');

    if (parts.length !== 2 || !parts[0].includes('id-') || !parts[1].includes('pwd-')) {
        throw new Error('Invalid meeting link');
    }

    const meetingId = parts[0]?.split('/')?.at(-1)?.replace('id-', '');

    const urlPassword = parts[1]?.replace('pwd-', '') ?? '';

    return {
        meetingId,
        urlPassword,
    };
};
