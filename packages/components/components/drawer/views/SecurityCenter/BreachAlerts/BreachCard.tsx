import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import ReadableDate from '@proton/components/containers/credentialLeak/ReadableDate';
import clsx from '@proton/utils/clsx';

import './BreachCard.scss';
import './UnpaidBreach.scss';

interface Props {
    name: string | null;
    email?: string;
    password?: string | null;
    publishedAt?: string;
    onClick?: () => void;
    style: {
        backgroundClass: string;
        colorClass: string;
        iconAltText: string;
    };
}

const BreachCard = ({ name, email, publishedAt, password, onClick, style }: Props) => {
    const { colorClass, backgroundClass, iconAltText } = style;

    return (
        <div className="group-hover-opacity-container security-card-container relative rounded-lg w-full gap-4">
            <Button
                className="drawerAppSection w-full px-4 py-3 border-none shadow-norm rounded-lg color-norm"
                onClick={onClick}
            >
                <span className="flex flex-nowrap items-start">
                    <span
                        className={clsx(
                            'ratio-square rounded flex security-card-icon-container relative',
                            backgroundClass
                        )}
                    >
                        <Icon name="bolt-filled" className={clsx('m-auto', colorClass)} alt={iconAltText} />
                        <Icon
                            name="exclamation-circle-filled"
                            className="absolute top-0 right-0 security-card-icon-bubble color-danger"
                        />
                    </span>
                    <span className="flex-1 text-left pl-2 pr-1">
                        <span className="block">{name}</span>
                        {publishedAt && <ReadableDate value={publishedAt} className="block m-0 text-sm color-weak" />}
                        {email && <span className="block m-0 text-sm color-danger">{email}</span>}
                        {password && <span className="block m-0 text-sm color-danger">{password}</span>}
                    </span>
                    <span className="flex-0 flex self-stretch color-weak">
                        <Icon name="chevron-right" className="my-auto group-hover:opacity-100" />
                    </span>
                </span>
            </Button>
        </div>
    );
};

export default BreachCard;
