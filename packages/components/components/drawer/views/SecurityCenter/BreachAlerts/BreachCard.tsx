import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { getBreachIcon } from '@proton/components/containers/credentialLeak/helpers';
import clsx from '@proton/utils/clsx';

import './BreachCard.scss';

interface Props {
    name: string | null;
    email?: string;
    password?: string | null;
    onClick?: () => void;
    style: {
        colorClass: string;
        iconAltText: string;
    };
    severity: number;
    unread: boolean;
}

const getCopy = (email?: string, password?: string | null) => {
    if (email && password) {
        return c('Info').t`Your email address and password were leaked:`;
    }
    if (email) {
        return c('Info').t`Your email address was exposed:`;
    }
    if (password) {
        return c('Info').t`Your password was leaked:`;
    }
};

const BreachCard = ({ name, email, password, onClick, style, severity, unread }: Props) => {
    const { colorClass, iconAltText } = style;

    const textInfo = getCopy(email, password);

    const breachIcon = getBreachIcon(severity);

    return (
        <div className="group-hover-opacity-container security-card-container relative rounded-lg w-full gap-4">
            <Button
                className="drawerAppSection w-full px-4 py-3 border-none shadow-norm rounded-lg color-norm"
                onClick={onClick}
            >
                <span className="flex flex-nowrap items-start">
                    <span className="flex security-card-icon-container security-card-icon-container--transparent relative">
                        <img src={breachIcon} className="m-auto w-full h-full" alt={iconAltText} />
                    </span>
                    <span className="flex-1 text-left pl-2 pr-1">
                        <span className={clsx('block', unread && 'text-bold')}>{name}</span>
                        <span className="block text-sm color-weak py-0.5">{textInfo}</span>
                        {email && (
                            <span className={clsx('block text-ellipsis m-0 text-sm', colorClass)} title={email}>
                                {email}
                            </span>
                        )}
                        {password && (
                            <span className={clsx('block text-ellipsis m-0 text-sm', colorClass)} title={password}>
                                {password}
                            </span>
                        )}
                    </span>
                    <span className="flex-0 flex self-stretch color-weak shrink-0">
                        <Icon name="chevron-right" className="my-auto group-hover:opacity-100" />
                    </span>
                </span>
            </Button>
        </div>
    );
};

export default BreachCard;
