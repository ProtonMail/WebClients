import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import guaranteeIllustration from './guarantee-illustration.png';

import './GuaranteeCard.scss';

const GuaranteeCard = ({ productName, className }: { productName: string; className?: string }) => {
    return (
        <div className={clsx('guarantee-card flex flex-nowrap gap-4 p-5 rounded-xl items-start', className)}>
            <img className="shrink-0" src={guaranteeIllustration} alt="" width="48" height="58" />

            <div className="flex flex-col gap-2">
                <h3 className="text-rg text-bold guarantee-card-header">{c('Info').t`30-day money-back guarantee`}</h3>
                <div className="text-sm">
                    {c('Info')
                        .t`Try ${productName} totally risk free - if for any reason you change your mind, you'll receive a full refund. No questions asked.`}
                </div>
            </div>
        </div>
    );
};

export default GuaranteeCard;
