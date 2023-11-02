interface Config {
    appTitle: string;
    devTools: boolean;
    url: {
        account: string;
        mail: string;
        calendar: string;
    };
}

const devConfig: Config = {
    appTitle: "DEV - Proton",
    devTools: true,
    url: {
        account: "https://account.proton.local",
        mail: "https://mail.proton.local",
        calendar: "https://calendar.proton.local",
    },
};

const prodConfig: Config = {
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
