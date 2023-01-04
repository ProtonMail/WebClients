const initialWindowLocation: Location = window.location;

export const mockWindowLocation = (origin = 'https://mail.proton.pink', hostname = 'mail.proton.pink') => {
    // @ts-ignore
    delete window.location;
    window.location = { ...initialWindowLocation, origin, hostname };
};

export const resetWindowLocation = () => {
    window.location = initialWindowLocation;
};
