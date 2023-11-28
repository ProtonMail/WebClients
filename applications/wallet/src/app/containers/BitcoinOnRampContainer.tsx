import { c } from 'ttag';

export const BitcoinOnRampContainer = () => {
    return (
        <div className="flex flex-column flex-item-grow p-8">
            <h2 className="text-semibold text-2xl mb-4">{c('Wallet Onramp').t`Buy bitcoins`}</h2>
        </div>
    );
};
