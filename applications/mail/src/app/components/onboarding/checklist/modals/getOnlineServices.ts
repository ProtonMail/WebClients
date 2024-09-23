import { c } from 'ttag';

import { ONLINE_SERVICES, type OnlineService, type OnlineServiceCategory } from '../constants';

interface OnlineServiceGroup {
    groupName: string;
    services: OnlineService[];
}

const getServiceByCategory = (
    serviceCategory: `${OnlineServiceCategory}`,
    collection: OnlineService[]
): OnlineService[] => collection.filter(({ category, mostPopular }) => category === serviceCategory && !mostPopular);

export const getOnlineServices = (): OnlineServiceGroup[] => {
    const onlineServicesArray = Object.values(ONLINE_SERVICES);

    return [
        {
            groupName: c('Online Accounts Name').t`Most popular`,
            services: onlineServicesArray.filter(({ mostPopular }) => !!mostPopular),
        },
        {
            groupName: c('Online Accounts Name').t`Banking`,
            services: getServiceByCategory('BANKING', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`E-commerce and Retail`,
            services: getServiceByCategory('SHOPPING', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Entertainment`,
            services: getServiceByCategory('ENTERTAINMENT', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Food and beverage`,
            services: getServiceByCategory('FOOD_DRINKS', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Gaming`,
            services: getServiceByCategory('GAMING', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Travel`,
            services: getServiceByCategory('TRAVEL', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Utilities`,
            services: getServiceByCategory('UTILITIES', onlineServicesArray),
        },
        {
            groupName: c('Online Accounts Name').t`Crypto`,
            services: getServiceByCategory('CRYPTO', onlineServicesArray),
        },
    ];
};
