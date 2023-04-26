import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import { useUserSettings } from '@proton/components/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import ServiceItem from './AccountsLoginModalServiceItem';
import { getOnlineAccounts } from './OnlineAccounts';

const SESSIONS_STORAGE_KEY = 'checkedItems';

const AccountsLoginModal = (props: ModalStateProps) => {
    const { items, markItemsAsDone } = useGetStartedChecklist();

    const [{ Locale }] = useUserSettings();
    const isUserInUS = Locale === 'en_US';

    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    const links = getOnlineAccounts();

    useEffect(() => {
        const checked = getItem(SESSIONS_STORAGE_KEY);
        setCheckedItems(checked ? JSON.parse(checked) : []);
    }, []);

    const handleDoneClick = async (serviceKey: string, hideItem: boolean) => {
        if (hideItem) {
            const newCheckedItems = [...checkedItems, serviceKey];
            setCheckedItems(newCheckedItems);
            setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newCheckedItems));
        }

        if (!items.has(ChecklistKey.AccountLogin)) {
            markItemsAsDone('AccountLogin');
        }
    };

    return (
        <ModalTwo size="medium" {...props}>
            <ModalTwoHeader title={c('Get started checklist instructions').t`Popular online services`} />
            <ModalTwoContent>
                <p className="color-weak mb-6">{c('Online accounts')
                    .t`Have an account with one of these services? Just click to change the email address to your ${MAIL_APP_NAME} address.`}</p>
                <div>
                    {links.map((group) => {
                        //Hide group if whole group is US only and user is not in US or if whole group is done
                        if (group.services.every((service) => service.usOnly) && !isUserInUS) {
                            return null;
                        }

                        const areAllServiceDone = group.services.every((service) => checkedItems.includes(service.key));

                        return (
                            <div key={group.groupName}>
                                <h2 className="text-semibold text-rg mb-2">{group.groupName}</h2>
                                <div className="mb-6 flex flex-column gap-2">
                                    {areAllServiceDone ? (
                                        <p className="color-weak text-sm mt-0">{c('Get started checklist instructions')
                                            .t`All services marked as done`}</p>
                                    ) : (
                                        group.services.map((service) => {
                                            //Hide services that are US only for users outside of US
                                            if (service.usOnly && !isUserInUS) {
                                                return null;
                                            }

                                            return (
                                                <ServiceItem
                                                    service={service}
                                                    key={service.key}
                                                    isServiceDone={checkedItems.includes(service.key)}
                                                    onServiceDone={handleDoneClick}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default AccountsLoginModal;
