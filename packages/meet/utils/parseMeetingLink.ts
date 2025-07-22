export const parseMeetingLink = (link: string) => {
    const meetingId = link.split('#')?.[0]?.split('/')?.at(-1)?.replace('id-', '');

    const urlPassword = link.split('#').at(-1)?.replace('pwd-', '') ?? '';

    return {
        meetingId,
        urlPassword,
    };
};
