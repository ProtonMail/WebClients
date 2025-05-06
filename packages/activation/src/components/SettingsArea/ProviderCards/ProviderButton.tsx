import { c } from 'ttag';

import { ImportProvider } from '@proton/activation/src/interface';
import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import yahooLogo from '@proton/styles/assets/img/import/providers/yahoo_short.svg';
import clsx from '@proton/utils/clsx';

import './ProviderCard.scss';

interface Props extends ButtonProps {
    provider: ImportProvider;
}

const { GOOGLE, OUTLOOK, YAHOO, DEFAULT } = ImportProvider;

const providerMap = {
    [GOOGLE]: {
        getName: () => c('Import provider').t`Import from Google`,
        logo: googleLogo,
        width: 16,
        height: 16,
    },
    [OUTLOOK]: {
        getName: () => c('Import provider').t`Import from Outlook`,
        logo: outlookLogo,
        width: 16,
        height: 16,
    },
    [YAHOO]: {
        getName: () => c('Import provider').t`Import from Yahoo`,
        logo: yahooLogo,
        width: 16,
        height: 16,
    },
    [DEFAULT]: {
        // translator: here 'Other' stands for "other provider"
        getName: () => c('Import provider').t`Import from other`,
        logo: '',
        width: 16,
        height: 16,
    },
};

const ProviderButton = ({ className, provider, ...rest }: Props) => {
    return (
        <Button className={clsx(className)} aria-label={c('Import provider').t`Import from ${provider}`} {...rest}>
            <span className="mr-2 flex">
                {provider === ImportProvider.DEFAULT ? null : (
                    <img
                        src={providerMap[provider].logo}
                        alt=""
                        className="self-center"
                        width={providerMap[provider].width}
                        height={providerMap[provider].height}
                    />
                )}
            </span>
            <span className="self-center">{providerMap[provider].getName()}</span>
        </Button>
    );
};

export default ProviderButton;
