import { c } from 'ttag';

import { ImportProvider } from '@proton/activation/src/interface';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import yahooLogo from '@proton/styles/assets/img/import/providers/yahoo_short.svg';
import clsx from '@proton/utils/clsx';

interface Props extends ButtonProps {
    provider: ImportProvider.OUTLOOK | ImportProvider.YAHOO;
}

const { OUTLOOK, YAHOO } = ImportProvider;

const providerMap = {
    [OUTLOOK]: {
        name: 'Outlook',
        logo: outlookLogo,
        width: 16,
        height: 16,
    },
    [YAHOO]: {
        name: 'Yahoo',
        logo: yahooLogo,
        width: 16,
        height: 16,
    },
};

const ProviderButton = ({ className, provider, ...rest }: Props) => {
    return (
        <Button
            className={clsx(className)}
            aria-label={c('Import provider').t`Import from ${providerMap[provider].name}`}
            {...rest}
        >
            <span className="mr-2 flex">
                <img
                    src={providerMap[provider].logo}
                    alt=""
                    className="self-center"
                    width={providerMap[provider].width}
                    height={providerMap[provider].height}
                />
            </span>
            <span className="self-center">{providerMap[provider].name}</span>
        </Button>
    );
};

export default ProviderButton;
