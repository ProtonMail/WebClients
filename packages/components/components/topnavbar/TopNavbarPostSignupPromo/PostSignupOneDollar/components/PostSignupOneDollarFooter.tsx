import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props {
    onClick: () => void;
    extended?: boolean;
}

export const PostSignupOneDollarFooter = ({ onClick, extended }: Props) => {
    return (
        <div className={clsx('text-center', extended ? 'mb-2' : 'mb-4')}>
            <Button color="norm" className="mb-2" onClick={onClick} fullWidth>{c('Offer').t`Get the deal`}</Button>
            <p className="m-0 color-weak">{c('Offer').t`Save 80% on your first month.`}</p>
        </div>
    );
};
