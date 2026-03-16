import type { ImportProvider } from '@proton/activation/src/interface';

import { providerMap } from '../../constants';

interface Props {
    provider: ImportProvider;
}

export const EasySwitchProviderName = ({ provider, ...rest }: Props) => {
    return (
        <div className="gap-2 flex">
            <img
                src={providerMap[provider].logo}
                alt=""
                className="self-center"
                width={providerMap[provider].width}
                height={providerMap[provider].height}
                {...rest}
            />
            <span className="self-center">{providerMap[provider].getName()}</span>
        </div>
    );
};
