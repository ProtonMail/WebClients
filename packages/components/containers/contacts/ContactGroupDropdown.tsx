import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import {
    getContactGroupsDelayedSaveChanges,
    hasReachedContactGroupMembersLimit,
} from '@proton/shared/lib/contacts/helpers/contactGroup';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { normalize } from '@proton/shared/lib/helpers/string';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import clsx from '@proton/utils/clsx';

import { DropdownButton, DropdownSizeUnit } from '../../components';
import Dropdown from '../../components/dropdown/Dropdown';
import Icon from '../../components/icon/Icon';
import Checkbox from '../../components/input/Checkbox';
import SearchInput from '../../components/input/SearchInput';
import { usePopperAnchor } from '../../components/popper';
import Mark from '../../components/text/Mark';
import Tooltip from '../../components/tooltip/Tooltip';
import { generateUID } from '../../helpers';
import { useContactEmails, useContactGroups, useMailSettings, useUser } from '../../hooks';
import { ContactGroupEditProps } from './group/ContactGroupEditModal';
import useApplyGroups from './hooks/useApplyGroups';
import { ContactGroupLimitReachedProps } from './modals/ContactGroupLimitReachedModal';
import { SelectEmailsProps } from './modals/SelectEmailsModal';

import './ContactGroupDropdown.scss';

const UNCHECKED = 0;
const CHECKED = 1;
const INDETERMINATE = 2;

/**
 * Build initial dropdown model
 */
const getModel = (contactGroups: ContactGroup[] = [], contactEmails: ContactEmail[]) => {
    if (!contactGroups.length) {
        return Object.create(null);
    }

    return contactGroups.reduce((acc, { ID }) => {
        const inGroup = contactEmails.filter(({ LabelIDs = [] }) => {
            return LabelIDs.includes(ID);
        });
        if (inGroup.length) {
            acc[ID] = contactEmails.length === inGroup.length ? CHECKED : INDETERMINATE;
        } else {
            acc[ID] = UNCHECKED;
        }
        return acc;
    }, Object.create(null));
};

interface Props extends ButtonProps {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    contactEmails: ContactEmail[];
    tooltip?: string;
    forToolbar?: boolean;
    onDelayedSave?: (changes: { [groupID: string]: boolean }) => void;
    onLock?: (lock: boolean) => void;
    onSuccess?: () => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached?: (props: ContactGroupLimitReachedProps) => void;
    onUpgrade: () => void;
    // Required when called with more than 1 contactEmail at a time
    onSelectEmails?: (props: SelectEmailsProps) => Promise<ContactEmail[]>;
}

const ContactGroupDropdown = ({
    children,
    className,
    contactEmails,
    disabled = false,
    forToolbar = false,
    tooltip = c('Action').t`Add to group`,
    onDelayedSave,
    onLock: onLockWidget,
    onSuccess,
    onGroupEdit,
    onLimitReached,
    onUpgrade,
    onSelectEmails,
    ...rest
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [{ hasPaidMail }] = useUser();
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [contactGroups = []] = useContactGroups();
    const [userContactEmails] = useContactEmails();
    const [initialModel, setInitialModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [model, setModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [uid] = useState(generateUID('contactGroupDropdown'));
    const [lock, setLock] = useState(false);
    const { applyGroups, contactGroupLimitReachedModal } = useApplyGroups(setLock, setLoading, onSelectEmails);

    // If the name and email are not empty, we can create a new group, otherwise we disable the button
    const canCreateNewGroup =
        contactEmails[0]?.Email !== '' &&
        validateEmailAddress(contactEmails[0]?.Email ?? '') &&
        contactEmails[0]?.Name !== '';

    useEffect(() => onLockWidget?.(isOpen), [isOpen]);

    const handleClick = () => {
        if (hasPaidMail) {
            if (hasReachedContactGroupMembersLimit(contactEmails.length, mailSettings, false)) {
                toggle();
            } else {
                onLimitReached?.({});
            }
        } else {
            onUpgrade();
        }
    };

    const handleCheck =
        (contactGroupID: string) =>
        ({ target }: ChangeEvent<HTMLInputElement>) =>
            setModel({ ...model, [contactGroupID]: +target.checked });

    const handleCreateContactGroup = async (groupID: string) => {
        // If creating a group with a delayed save, check the associated checkbox
        handleCheck(groupID);

        // Do the delayed save with the group ID
        if (onDelayedSave) {
            onDelayedSave({ [groupID]: true });
        }
    };

    const handleAdd = () => {
        // Should be handled differently with the delayed save, because we need to add the current email to the new group
        onGroupEdit({
            selectedContactEmails: contactEmails,
            onDelayedSave: onDelayedSave ? handleCreateContactGroup : undefined,
        });
        close();
    };

    const handleApply = async () => {
        const changes = Object.entries(model).reduce<{ [groupID: string]: boolean }>((acc, [groupID, isChecked]) => {
            if (isChecked !== initialModel[groupID]) {
                acc[groupID] = isChecked === CHECKED;
            }
            return acc;
        }, {});

        // Use delayed save when editing a contact, in this case contact might not be created yet so we save later
        if (onDelayedSave) {
            const updatedChanges = getContactGroupsDelayedSaveChanges({
                userContactEmails,
                changes,
                onLimitReached,
                model,
                initialModel,
                mailSettings,
            });

            onDelayedSave(updatedChanges);
        } else {
            await applyGroups(contactEmails, changes);
        }

        close();
        onSuccess?.();
    };

    useEffect(() => {
        if (isOpen) {
            const initialModel = getModel(contactGroups, contactEmails);
            setInitialModel(initialModel);
            setModel(initialModel);
        }
    }, [contactGroups, contactEmails, isOpen]);

    const isPristine = useMemo(() => {
        return isDeepEqual(initialModel, model);
    }, [initialModel, model]);

    const filteredContactGroups = useMemo(() => {
        if (!Array.isArray(contactGroups)) {
            return [];
        }
        const normalizedKeyword = normalize(keyword, true);
        if (!normalizedKeyword.length) {
            return contactGroups;
        }
        return contactGroups.filter(({ Name }) => normalize(Name, true).includes(normalizedKeyword));
    }, [keyword, contactGroups]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await handleApply();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Tooltip title={tooltip}>
                <DropdownButton
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    hasCaret={!forToolbar}
                    disabled={disabled}
                    className={clsx([forToolbar ? 'button-for-icon' : 'flex flex-align-items-center', className])}
                    {...rest}
                >
                    {children}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id="contact-group-dropdown"
                className="contactGroupDropdown"
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                autoClose={false}
                autoCloseOutside={!lock}
                size={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-justify-space-between flex-align-items-center m-4 mb-0">
                        <strong>{c('Label').t`Add to group`}</strong>
                        <Tooltip
                            title={
                                canCreateNewGroup
                                    ? c('Info').t`Create a new contact group`
                                    : c('Info').t`Please provide a name and an email address for creating a group.`
                            }
                        >
                            <div>
                                <Button
                                    icon
                                    color="norm"
                                    size="small"
                                    onClick={handleAdd}
                                    className="flex flex-align-items-center"
                                    data-prevent-arrow-navigation
                                    disabled={!canCreateNewGroup}
                                >
                                    <Icon name="users" alt={c('Action').t`Create a new contact group`} /> +
                                </Button>
                            </div>
                        </Tooltip>
                    </div>
                    <div className="m-4 mb-0">
                        <SearchInput
                            value={keyword}
                            onChange={setKeyword}
                            autoFocus
                            placeholder={c('Placeholder').t`Filter groups`}
                            data-prevent-arrow-navigation
                        />
                    </div>
                    <div className="scroll-if-needed mt-4 contactGroupDropdown-list-container">
                        {filteredContactGroups.length ? (
                            <ul className="unstyled my-0">
                                {filteredContactGroups.map(({ ID, Name, Color }) => {
                                    const checkboxId = `${uid}${ID}`;
                                    return (
                                        <li
                                            key={ID}
                                            className="dropdown-item w100 flex flex-nowrap flex-align-items-center py-2 px-4"
                                        >
                                            <Checkbox
                                                className="flex-item-noshrink"
                                                id={checkboxId}
                                                checked={model[ID] === CHECKED}
                                                indeterminate={model[ID] === INDETERMINATE}
                                                onChange={handleCheck(ID)}
                                            />
                                            <label
                                                htmlFor={checkboxId}
                                                className="flex flex-align-items-center flex-item-fluid flex-nowrap"
                                                data-testid={`contact-group-dropdown:item-${Name}`}
                                            >
                                                <Icon
                                                    name="circle-filled"
                                                    className="ml-1 mr-2 flex-item-noshrink"
                                                    size={16}
                                                    color={Color}
                                                />
                                                <span className="flex-item-fluid text-ellipsis" title={Name}>
                                                    <Mark value={keyword}>{Name}</Mark>
                                                </span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                        {!filteredContactGroups.length && keyword ? (
                            <div className="w100 flex flex-nowrap flex-align-items-center py-2 px-4">
                                <Icon name="exclamation-circle" className="mr-2" />
                                {c('Info').t`No group found`}
                            </div>
                        ) : null}
                    </div>
                    <div className="m-4">
                        <Button
                            color="norm"
                            fullWidth
                            loading={loading}
                            disabled={isPristine || !filteredContactGroups.length}
                            data-prevent-arrow-navigation
                            type="submit"
                            data-testid="contact-group-dropdown:apply-chosen-groups"
                        >
                            {c('Action').t`Apply`}
                        </Button>
                    </div>
                </form>
            </Dropdown>
            {contactGroupLimitReachedModal}
        </>
    );
};

export default ContactGroupDropdown;
