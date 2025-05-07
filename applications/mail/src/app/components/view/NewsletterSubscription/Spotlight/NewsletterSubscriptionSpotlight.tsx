import { c } from 'ttag';

import spotlightStar from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

export const NewsletterSubscription = () => {
    return (
        <div className="flex flex-nowrap items-start gap-4">
            <div className="shrink-0">
                <img alt="" src={spotlightStar} className="w-custom" style={{ '--w-custom': '2.5rem' }} />
            </div>
            <div className="flex flex-column flex-nowrap items-start">
                <p className="text-bold m-0 mb-2">{c('Title').t`Your subscriptions in one place`}</p>
                <p className="m-0">{c('Info').t`Easily manage and unsubscribe from newsletters and mailing lists.`}</p>
            </div>
        </div>
    );
};
