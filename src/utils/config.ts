const devConfig = {
    appTitle: "DEV - Proton",
    devTools: true,
    url: {
        account: "https://account.proton.local",
        mail: "https://mail.proton.local",
        calendar: "https://calendar.proton.local",
    },
};

const prodConfig = {
    appTitle: "Proton",
    devTools: false,
    url: {
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    },
};

export const getConfig = (isPackaged: boolean) => {
    return isPackaged ? prodConfig : devConfig;
};
