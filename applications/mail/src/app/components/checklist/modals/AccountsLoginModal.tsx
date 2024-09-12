import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { useUser, useUserSettings } from '@proton/components/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import {
    getSavedCheckedItemsForUser,
    saveCheckedItemsForUser,
} from 'proton-mail/helpers/checklist/checkedItemsStorage';

import ServiceItem from './AccountsLoginModalServiceItem';
import { getOnlineAccounts } from './OnlineAccounts';

const AccountsLoginModal = (props: ModalStateProps) => {
    const { items, markItemsAsDone } = useGetStartedChecklist();
    const [user] = useUser();

    const [{ Locale }] = useUserSettings();
    const isUserInUS = Locale === 'en_US';

    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    const links = getOnlineAccounts();

    useEffect(() => {
        const data = getSavedCheckedItemsForUser(user.ID);
        setCheckedItems(data);
    }, []);

    const handleDoneClick = async (serviceKey: string, hideItem: boolean) => {
        if (hideItem) {
            const newCheckedItems = [...checkedItems, serviceKey];
            setCheckedItems(newCheckedItems);
            // Save both the user id and the checked items to avoid issue with multiple sessions
            saveCheckedItemsForUser(user.ID, newCheckedItems);
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
                        // Hide group if whole group is US only and user is not in US or if whole group is done
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
                                            .t`Nice! You've updated all services in this category.`}</p>
                                    ) : (
                                        group.services.map((service) => {
                                            // Hide services that are US only for users outside of US
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
                    {checkedItems.length > 0 && (
                        <>
                            <h2 className="text-semibold text-rg mb-2 mt-8">{c('Get started checklist instructions')
                                .t`Changed accounts`}</h2>
                            <div>
                                <div className="mb-6 flex flex-column gap-2">
                                    {checkedItems.map((item) => {
                                        const mappedItem = links
                                            .flatMap((group) => group.services)
                                            .find((service) => service.key === item);

                                        if (!mappedItem) {
                                            return null;
                                        }

                                        return (
                                            <ServiceItem
                                                service={mappedItem}
                                                key={mappedItem.key}
                                                onServiceDone={handleDoneClick}
                                                isServiceDone={false}
                                                serviceMarkedAsDone
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default AccountsLoginModal;
