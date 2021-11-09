import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import yahooLogo from '@proton/styles/assets/img/import/providers/yahoo.svg';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import otherIllu from '@proton/styles/assets/img/import/providers/other.svg';

import { Button, ButtonProps } from '../button';
import { classnames } from '../../helpers';

import './ProviderCard.scss';

export enum ImportProvider {
    GOOGLE = 'google',
    OUTLOOK = 'outlook',
    YAHOO = 'yahoo',
    OTHER = 'other',
}

interface Props extends ButtonProps {
    provider: ImportProvider;
}

const { GOOGLE, OUTLOOK, YAHOO, OTHER } = ImportProvider;

const ProviderCard = ({ className, provider, ...rest }: Props) => {
    const providerMap = {
        [GOOGLE]: {
            name: 'Google',
            logo: googleLogo,
            width: 32,
            height: 32,
        },
        [OUTLOOK]: {
            name: 'Outlook.com',
            logo: outlookLogo,
            width: 44,
            height: 44,
        },
        [YAHOO]: {
            name: 'Yahoo Mail',
            logo: yahooLogo,
            width: 76,
            height: 22,
        },
        [OTHER]: {
            name: 'Other',
            logo: otherIllu,
            width: 48,
            height: 46,
        },
    };

    const { name, logo, width, height } = providerMap[provider];

    return (
        <Button className={classnames(['provider-card inline-flex flex-column ', className])} {...rest}>
            <div className="flex-item-fluid flex flex-justify-center w100">
                <img src={logo} alt="" className="flex-align-self-center" width={width} height={height} />
            </div>
            <span className="flex-align-self-center">{name}</span>
        </Button>
    );
};

export default ProviderCard;
