import type { UnlimitedOfferConfig } from '../helpers/interface';

interface Props {
    config: UnlimitedOfferConfig;
}

export const GoUnlimitedOfferHeader = ({ config }: Props) => {
    return (
        <header className="text-center">
            <h2 className="text-xl text-bold text-wrap-balance">{config.title}</h2>
        </header>
    );
};
