import { useRef, useState } from 'react';

import { c } from 'ttag';

import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';

import ServiceAccountForm, {
    type ServiceAccountFormSharedProps,
    type ServiceAccountFormValues,
} from './ServiceAccountForm';
import { ServiceAccountSetupError } from './actions';
import { getSuggestedServiceAccountName } from './suggestedServiceAccountNames';

interface Props extends ServiceAccountFormSharedProps {
    /** Resolves with the free address a name would get, or why it cannot get one. */
    checkEmail: (name: string) => Promise<{ email?: string; error?: string }>;
    onCreate: (args: ServiceAccountFormValues & { email?: string; pending?: ServiceAccount }) => Promise<void>;
}

const CreateServiceAccountModal = ({ checkEmail, onCreate, ...rest }: Props) => {
    const [initialName] = useState(() => getSuggestedServiceAccountName([...rest.usedNames]));
    // Set when an earlier attempt created the account but could not set it up, so a retry reuses it.
    const [pending, setPending] = useState<ServiceAccount>();
    // Free addresses found per name, so the account is created with the address found when its name was checked. A ref,
    // since the form submits right after validating, before a state update would reach its handler.
    const foundEmails = useRef(new Map<string, string>());

    return (
        <ServiceAccountForm
            {...rest}
            title={c('Title').t`Add service account`}
            submitLabel={c('Action').t`Add service account`}
            initialName={initialName}
            initialManagers={[]}
            ownName={pending?.Name}
            selectNameOnOpen
            // The created account now holds the address, so checking it again would report it as taken.
            validateName={
                pending
                    ? undefined
                    : async (name) => {
                          const { email, error } = await checkEmail(name);
                          if (email) {
                              foundEmails.current.set(name, email);
                          }
                          return error;
                      }
            }
            notice={
                pending &&
                c('Info').t`The service account was created. Retry saving to finish setting up its keys and managers.`
            }
            onSubmit={async (values) => {
                try {
                    await onCreate({ ...values, email: foundEmails.current.get(values.name), pending });
                } catch (error) {
                    if (error instanceof ServiceAccountSetupError) {
                        setPending(error.account);
                    }
                    throw error;
                }
            }}
        />
    );
};

export default CreateServiceAccountModal;
