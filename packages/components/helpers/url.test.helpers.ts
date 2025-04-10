const initialWindowLocation: Location = window.location;

export const mockWindowLocation = (origin = 'https://mail.proton.pink', hostname = 'mail.proton.pink') => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { ...initialWindowLocation, origin, hostname };
};

export const resetWindowLocation = () => {
    // @ts-ignore
    window.location = initialWindowLocation;
};
