export const getMockedWindowLocation = ({
    origin = 'https://mail.proton.pink',
    hostname = 'mail.proton.pink',
    href = '',
}) => {
    return {
        ...window.location,
        href,
        hostname,
        origin,
        port: '',
    };
};
