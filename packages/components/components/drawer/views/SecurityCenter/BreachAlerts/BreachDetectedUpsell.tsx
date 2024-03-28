import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';

import './UnpaidBreach.scss';

interface Props {
    onBreachDetectedUpsellClick?: () => void;
}

const BreachDetectedUpsell = ({ onBreachDetectedUpsellClick }: Props) => {
    return (
        <div className="group-hover-opacity-container security-card-container relative rounded-lg w-full gap-4">
            <Button
                className="drawerAppSection w-full px-4 py-3 border-none shadow-norm rounded-lg color-danger hover:color-danger unpaid-breach-detected-card"
                onClick={onBreachDetectedUpsellClick}
            >
                <span className="flex flex-nowrap items-start">
                    <span className="ratio-square rounded flex relative unpaid-icon-bg">
                        <Icon name="bolt-filled" className="m-auto" />
                        <Icon
                            name="exclamation-circle-filled"
                            className="absolute top-0 right-0 security-card-icon-bubble"
                        />
                    </span>
                    <span className="flex-1 text-left pl-2 pr-1">
                        <span className="block">{c('Title').t`Breach detected`}</span>
                        <span className="block m-0 text-sm ">{c('Description')
                            .t`Your information was found in at least one data breach.`}</span>
                        <span className="block m-0 text-sm text-underline">{c('Info').t`View details`}</span>
                    </span>
                    <span className="flex-0 flex self-stretch color-weak">
                        <Icon name="chevron-right" className="my-auto group-hover:opacity-100" />
                    </span>
                </span>
            </Button>
        </div>
    );
};

export default BreachDetectedUpsell;
