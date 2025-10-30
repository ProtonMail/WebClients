import type { UnlimitedToDuoOfferConfig } from '../helpers/interface';

interface Props {
    config: UnlimitedToDuoOfferConfig;
}

export const UnlimitedToDuoOfferHeader = ({ config }: Props) => {
    return (
        <header className="w-9/10">
            <h2 className="text-center text-xl text-bold">{config.title}</h2>
        </header>
    );
};
