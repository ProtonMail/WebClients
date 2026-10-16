import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

interface Props {
    onRetry: () => void;
}

export const BYOEMobileConnectionsError = ({ onRetry }: Props) => {
    return (
        <div className="flex flex-column items-center gap-4 py-6 px-4 text-center" role="alert">
            <p className="m-0 text-lg color-weak">{c('Error').t`Couldn't load your connections`}</p>
            <Button shape="solid" color="weak" pill onClick={onRetry}>{c('Action').t`Try again`}</Button>
        </div>
    );
};
