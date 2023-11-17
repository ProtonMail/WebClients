import { c } from 'ttag';

import { ImportProvider } from '@proton/activation/src/interface';
import { Button, ButtonProps } from '@proton/atoms';
import { Icon } from '@proton/components';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import yahooLogo from '@proton/styles/assets/img/import/providers/yahoo.svg';
import clsx from '@proton/utils/clsx';

import './ProviderCard.scss';

interface Props extends ButtonProps {
    provider: ImportProvider;
}

const { GOOGLE, OUTLOOK, YAHOO, DEFAULT } = ImportProvider;

const ProviderCard = ({ className, provider, ...rest }: Props) => {
    const providerMap = {
        [GOOGLE]: {
            name: 'Google',
            logo: googleLogo,
            width: 32,
            height: 32,
        },
        [OUTLOOK]: {
            name: 'Outlook',
            logo: outlookLogo,
            width: 44,
            height: 44,
        },
        [YAHOO]: {
            name: 'Yahoo',
            logo: yahooLogo,
            width: 76,
            height: 22,
        },
        [DEFAULT]: {
            // translator: here 'Other' stand for "other provider"
            name: c('Import provider').t`Other`,
            logo: 'three-dots-horizontal',
            width: 48,
            height: 46,
        },
    };

    const { name, logo, width, height } = providerMap[provider];

    return (
        <Button
            className={clsx(['provider-card inline-flex flex-column py-5', className])}
            aria-label={c('Import provider').t`Import from ${provider}`}
            {...rest}
        >
            <div className="flex-item-fluid flex justify-center w-full">
                {provider === ImportProvider.DEFAULT ? (
                    <Icon name={logo} className="self-center" size={40} />
                ) : (
                    <img src={logo} alt="" className="self-center" width={width} height={height} />
                )}
            </div>
            <span className="self-center">{name}</span>
        </Button>
    );
};

export default ProviderCard;
