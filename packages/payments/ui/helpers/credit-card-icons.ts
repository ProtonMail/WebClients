const banks = require.context('@proton/styles/assets/img/credit-card-icons', true, /.svg$/);

type BanksMap = {
    [bank: string]: () => string | undefined;
};

const banksMap = banks.keys().reduce<BanksMap>((acc, key) => {
    acc[key] = () => banks(key);
    return acc;
}, {});

export const getBankSvg = (type = '') => {
    const key = `./cc-${type}.svg`;

    if (!banksMap[key]) {
        return;
    }

    return banksMap[key]();
};
