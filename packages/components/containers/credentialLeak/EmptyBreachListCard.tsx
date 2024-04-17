import { c } from 'ttag';

import allGood from '@proton/styles/assets/img/breach-alert/img-no-breaches-found.svg';
import clsx from '@proton/utils/clsx';

import { ListType } from './models';

const EmptyBreachListCard = ({ listType, className = '' }: { listType: ListType; className?: string }) => {
    return (
        <div className={clsx('pt-4 flex flex-column flex-nowrap', className)}>
            <img src={allGood} width="400" alt="" className="display-block mx-auto" />
            <h3 className="color-success text-center m-auto text-rg text-semibold">
                {listType === 'open'
                    ? c('Title').t`You have no open alerts`
                    : c('Title').t`You have no resolved alerts`}
            </h3>
        </div>
    );
};

export default EmptyBreachListCard;
