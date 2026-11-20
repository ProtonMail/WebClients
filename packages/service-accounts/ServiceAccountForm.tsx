import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { InputField } from '@proton/components/components/v2/field/InputField';
import useLoading from '@proton/hooks/useLoading';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ServiceAccountManager } from '@proton/shared/lib/interfaces/ServiceAccount';

import ServiceAccountManagers from './ServiceAccountManagers';
import { type ServiceAccountManagerOption, getManagerChanges } from './helpers';
import { normalizeServiceAccountName } from './selectors';

export interface ServiceAccountFormValues {
    name: string;
    managers: ServiceAccountManagerOption[];
}

/** Props the create and edit modals pass through unchanged. */
export interface ServiceAccountFormSharedProps extends ModalStateProps {
    /** Normalized names already taken in the organization. */
    usedNames: Set<string>;
    members: Record<string, ServiceAccountManagerOption>;
    excludedMemberIDs: string[];
    canAssign: boolean;
    canRemove: boolean;
}

interface Props extends ServiceAccountFormSharedProps {
    title: string;
    subline?: string;
    submitLabel: string;
    initialName: string;
    initialManagers: ServiceAccountManager[];
    /** The account's own name, which does not count as already used. */
    ownName?: string;
    selectNameOnOpen?: boolean;
    nameLocked?: boolean;
    /** Keep submit disabled until the name or managers change. */
    requireChanges?: boolean;
    /** Shown below a submit error. */
    notice?: string;
    /** Resolves with why the name cannot be used. Runs when the field loses focus, and on submit if the name changed. */
    validateName?: (name: string) => Promise<string | undefined>;
    onSubmit: (values: ServiceAccountFormValues) => Promise<void>;
}

// Defined outside the component so React calls it once, when the input mounts.
const selectText = (input: HTMLInputElement | null) => input?.select();

const ServiceAccountForm = ({
    title,
    subline,
    submitLabel,
    initialName,
    initialManagers,
    ownName,
    selectNameOnOpen,
    nameLocked,
    requireChanges,
    notice,
    validateName,
    onSubmit,
    usedNames,
    members,
    excludedMemberIDs,
    canAssign,
    canRemove,
    open,
    onClose,
    onExit,
}: Props) => {
    const [name, setName] = useState(initialName);
    const [selected, setSelected] = useState<ServiceAccountManagerOption[]>(() =>
        initialManagers.map(({ MemberID }) => ({ MemberID, Name: '', Email: '' }))
    );
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState<string>();
    const [saved, setSaved] = useState(false);
    const { createNotification } = useNotifications();

    const nameCheckRef = useRef<{ name: string; result: Promise<string | undefined> }>(undefined);
    const [nameCheck, setNameCheck] = useState<{ name: string; error?: string }>();

    const normalizedName = normalizeServiceAccountName(name);
    const nameExists = normalizedName !== normalizeServiceAccountName(ownName) && usedNames.has(normalizedName);
    // Saving refetches the list, which then holds the name just saved: only validate while the name is being edited.
    const getNameError = () => {
        if (loading || saved) {
            return undefined;
        }
        if (nameExists) {
            return c('Error').t`Name already used within your organization`;
        }
        return (nameCheck?.name === name.trim() && nameCheck.error) || undefined;
    };
    const nameError = getNameError();

    /** Validate a name once: a second call with the same name reuses the first result, even while it is pending. */
    const checkName = (value: string) => {
        if (!validateName || !value) {
            return Promise.resolve(undefined);
        }
        if (nameCheckRef.current?.name !== value) {
            const result = validateName(value).catch(() => undefined);
            nameCheckRef.current = { name: value, result };
            void result.then((error) => setNameCheck({ name: value, error }));
        }
        return nameCheckRef.current.result;
    };
    const { added, removed } = getManagerChanges(initialManagers, selected);
    const dirty = !requireChanges || name.trim() !== initialName || added.length > 0 || removed.length > 0;
    const close = () => !loading && onClose();

    const submit = async () => {
        setError(undefined);
        if (await checkName(name.trim())) {
            return;
        }
        try {
            await onSubmit({ name: name.trim(), managers: selected });
            setSaved(true);
            createNotification({ text: c('Success').t`Service account saved` });
            onClose();
        } catch (e) {
            setError(
                getApiErrorMessage(e) ||
                    (e instanceof Error ? e.message : c('Error').t`Changes could not be saved. Please try again.`)
            );
        }
    };

    return (
        <Modal
            open={open}
            onExit={onExit}
            size="large"
            className="service-account-modal"
            onClose={close}
            disableCloseOnEscape={loading}
            as="form"
            onSubmit={(event) => {
                event.preventDefault();
                void withLoading(submit);
            }}
        >
            <ModalHeader title={title} subline={subline} closeButtonProps={{ disabled: loading }} />
            <ModalContent>
                {error && (
                    <Banner variant="danger" className="mb-4" role="alert">
                        {error}
                    </Banner>
                )}
                {error && notice && (
                    <Banner variant="info" className="mb-4">
                        {notice}
                    </Banner>
                )}
                <InputField
                    label={c('Label').t`Service name`}
                    bigger
                    placeholder={c('Placeholder').t`e.g. ci-bot`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    ref={selectNameOnOpen ? selectText : undefined}
                    onBlur={() => {
                        if (!nameExists) {
                            void checkName(name.trim());
                        }
                    }}
                    error={nameError}
                    disabled={loading || nameLocked}
                    maxLength={100}
                    autoFocus
                    required
                />
                <div className="mt-6">
                    <ServiceAccountManagers
                        selected={selected.map((manager) => members[manager.MemberID] || manager)}
                        onChange={setSelected}
                        excludedMemberIDs={excludedMemberIDs}
                        canAssign={canAssign}
                        canRemove={canRemove}
                        disabled={loading}
                        existingMemberIDs={initialManagers.map(({ MemberID }) => MemberID)}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button color="weak" onClick={close} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading} disabled={!dirty || !name.trim() || !!nameError}>
                    {submitLabel}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ServiceAccountForm;
