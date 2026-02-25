import { useState } from 'react';

import { c } from 'ttag';

import {
    recoverDelegatedAccessStep1Thunk,
    recoverDelegatedAccessStep2Thunk,
} from '@proton/account/delegatedAccess/outgoingActions';
import { getViewRecoveryContactInfoRoute } from '@proton/account/delegatedAccess/routes';
import { ContactView } from '@proton/account/delegatedAccess/shared/ContactView';
import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import {
    getCanOutgoingDelegatedAccessRecoverStep1,
    getCanOutgoingDelegatedAccessRecoverStep2,
} from '@proton/account/delegatedAccess/shared/outgoing/helper';
import type { EnrichedOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/interface';
import { useDispatch } from '@proton/account/delegatedAccess/useDispatch';
import Radio from '@proton/components/components/input/Radio';
import type { ReactivateKeysContentProps } from '@proton/components/containers/keys/reactivateKeys/interface';
import { getKeyReactivationNotification } from '@proton/components/containers/keys/reactivateKeys/reactivateHelper';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSettingsLink } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

const ContactSelector = ({
    item,
    checked,
    onSelectContact,
}: {
    item: ReturnType<typeof useOutgoingController>['items']['recoveryContacts'][0];
    checked: boolean;
    onSelectContact?: () => void;
}) => {
    const id = item.outgoingDelegatedAccess.DelegatedAccessID;
    const name = item.parsedOutgoingDelegatedAccess.contact.name;

    if (onSelectContact) {
        return (
            <button
                type="button"
                onClick={onSelectContact}
                aria-pressed={checked}
                className={clsx(
                    'w-full flex items-center flex-nowrap py-3 px-4 text-left interactive',
                    checked && 'bg-weak'
                )}
                aria-label={c('emergency_access').t`Select recovery contact ${name}`}
            >
                <div className="flex-1">
                    <ContactView
                        id={`${id}-contact`}
                        {...item.parsedOutgoingDelegatedAccess.contact}
                        createdAtDate={item.parsedOutgoingDelegatedAccess.createdAtDate}
                    />
                </div>
                <div className="shrink-0" aria-hidden="true">
                    <Radio
                        id={`${id}`}
                        aria-labelledby={`${id}-contact`}
                        name="recovery-contact"
                        checked={checked}
                        tabIndex={-1}
                        readOnly
                    />
                </div>
            </button>
        );
    }

    return (
        <div className="py-3 px-4">
            <ContactView
                id={`${id}-contact`}
                {...item.parsedOutgoingDelegatedAccess.contact}
                createdAtDate={item.parsedOutgoingDelegatedAccess.createdAtDate}
            />
        </div>
    );
};

export const RecoveryContactFormId = 'recovery-contact-form';

export const RecoveryContactFormStep1 = ({
    onLoading,
    onClose,
    recoveryContacts,
}: ReactivateKeysContentProps & { recoveryContacts: EnrichedOutgoingDelegatedAccess[] }) => {
    const handleError = useErrorHandler();
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const goToSettings = useSettingsLink();

    const handleSubmit = async (recoveryContact: (typeof recoveryContacts)[0]) => {
        try {
            onLoading(true);

            await dispatch(
                recoverDelegatedAccessStep1Thunk({
                    outgoingDelegatedAccess: recoveryContact.outgoingDelegatedAccess,
                })
            );
            createNotification({ text: c('emergency_access').t`Recovery request sent` });
            onClose?.();
            goToSettings(getViewRecoveryContactInfoRoute(recoveryContact.outgoingDelegatedAccess.DelegatedAccessID));
        } catch (error) {
            handleError(error);
        } finally {
            onLoading(false);
        }
    };

    const recoverableRecoveryContacts = recoveryContacts.filter(getCanOutgoingDelegatedAccessRecoverStep1);

    const recoveryContactId = recoverableRecoveryContacts.findIndex(
        (value) => value.outgoingDelegatedAccess.DelegatedAccessID === selectedContactId
    );
    const recoveryContact = recoverableRecoveryContacts[recoveryContactId] ?? recoverableRecoveryContacts[0];
    const multipleRecoveryContacts = recoverableRecoveryContacts.length > 1;

    return (
        <form
            id={RecoveryContactFormId}
            onSubmit={(event) => {
                event.preventDefault();
                if (recoveryContact) {
                    void handleSubmit(recoveryContact);
                }
            }}
        >
            <div className="mb-4">
                {c('emergency_access')
                    .t`Ask a recovery contact for help. They’ll get an email to verify your request and unlock your data.`}
            </div>
            <div
                className={clsx(
                    'mb-4 rounded-xl border overflow-hidden',
                    multipleRecoveryContacts ? 'border-weak divide-y divide-weak' : 'border-primary'
                )}
            >
                {recoverableRecoveryContacts.map((item) => {
                    return (
                        <ContactSelector
                            key={item.outgoingDelegatedAccess.DelegatedAccessID}
                            checked={item === recoveryContact}
                            onSelectContact={
                                multipleRecoveryContacts
                                    ? () => {
                                          setSelectedContactId(item.outgoingDelegatedAccess.DelegatedAccessID);
                                      }
                                    : undefined
                            }
                            item={item}
                        />
                    );
                })}
            </div>
            <div>
                {c('emergency_access')
                    .t`Get in touch with them now to see if they can help, and to let them know personally it’s you trying to unlock your data.`}
            </div>
        </form>
    );
};

export const RecoveryContactFormStep2 = ({
    onLoading,
    onClose,
    recoveryContact,
}: ReactivateKeysContentProps & { recoveryContact: EnrichedOutgoingDelegatedAccess }) => {
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleSubmit = async () => {
        try {
            onLoading(true);

            const result = await dispatch(
                recoverDelegatedAccessStep2Thunk({
                    outgoingDelegatedAccess: recoveryContact.outgoingDelegatedAccess,
                    ignoreVerification: false,
                })
            );

            createNotification(getKeyReactivationNotification(result));
            onClose?.();
        } catch (error) {
            handleError(error);
        } finally {
            onLoading(false);
        }
    };

    return (
        <form
            id={RecoveryContactFormId}
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
        >
            <div className="mb-4">{c('emergency_access').t`Your recovery contact has helped you recover data.`}</div>
            <div className="mb-4 rounded-xl border overflow-hidden">
                <ContactSelector checked={false} onSelectContact={undefined} item={recoveryContact} />
            </div>
        </form>
    );
};

export const RecoveryContactForm = (props: ReactivateKeysContentProps) => {
    const { items } = useOutgoingController();
    const firstRecoverableContact = items.recoveryContacts.find(getCanOutgoingDelegatedAccessRecoverStep2);
    return firstRecoverableContact ? (
        <RecoveryContactFormStep2 recoveryContact={firstRecoverableContact} {...props} />
    ) : (
        <RecoveryContactFormStep1 recoveryContacts={items.recoveryContacts} {...props} />
    );
};
