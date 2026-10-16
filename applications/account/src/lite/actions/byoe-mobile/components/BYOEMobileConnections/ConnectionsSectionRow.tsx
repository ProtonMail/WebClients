import type { PropsWithChildren } from 'react';

import type { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { providerLogos } from '@proton/activation/src/components/ReportsTable/ReportsTableIcon';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';

// TODO add support for different provider logos

interface Props extends PropsWithChildren {
    apiProvider: ApiImportProvider;
}

export const ConnectionsSectionRow = ({ apiProvider, children }: Props) => {
    const provider = getImportProviderFromApiProvider(apiProvider);
    const logo = providerLogos[provider];

    return (
        <div className="flex flex-nowrap items-center gap-4 bg-norm rounded-xl px-4 py-3 mb-2">
            <div
                className="shrink-0 flex items-center justify-center border border-weak rounded-lg w-custom h-custom"
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
            >
                <img src={logo} alt="" width={24} />
            </div>
            {children}
        </div>
    );
};

export const ConnectionSectionStringContent = ({
    firstLine,
    secondLine,
}: {
    firstLine: string;
    secondLine?: string;
}) => {
    return (
        <div className="flex-1 min-w-0">
            <p className="m-0 text-ellipsis">{firstLine}</p>
            {secondLine && <p className="m-0 text-sm color-weak text-wrap-balance">{secondLine}</p>}
        </div>
    );
};
