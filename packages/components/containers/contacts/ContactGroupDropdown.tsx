import { useState, useEffect, useMemo, ReactNode, ChangeEvent } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { normalize } from '@proton/shared/lib/helpers/string';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import { usePopperAnchor } from '../../components/popper';
import { useLoading, useContactGroups, useModals } from '../../hooks';
import { classnames, generateUID } from '../../helpers';
import Dropdown from '../../components/dropdown/Dropdown';
import Tooltip from '../../components/tooltip/Tooltip';
import Icon from '../../components/icon/Icon';
import SearchInput from '../../components/input/SearchInput';
import { ButtonProps } from '../../components/button/Button';
import { Button } from '../../components/button';
import Mark from '../../components/text/Mark';
import Checkbox from '../../components/input/Checkbox';
import ContactGroupModal from './modals/ContactGroupModal';
import useApplyGroups from './useApplyGroups';

import './ContactGroupDropdown.scss';
import { DropdownButton } from '../../components';

const UNCHECKED = 0;
const CHECKED = 1;
const INDETERMINATE = 2;

/**
 * Build initial dropdown model
 * @param {Array} contactGroups
 * @param {Array} contactEmails
 * @returns {Object}
 */
const getModel = (contactGroups: ContactGroup[] = [], contactEmails: ContactEmail[] = []) => {
    if (!contactEmails.length || !contactGroups.length) {
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
}

const ContactGroupDropdown = ({
    children,
    className,
    contactEmails,
    disabled = false,
    forToolbar = false,
    tooltip = c('Action').t`Add to group`,
    onDelayedSave,
    ...rest
}: Props) => {
    const [keyword, setKeyword] = useState('');
    const [loading, withLoading] = useLoading();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createModal } = useModals();
    const [contactGroups = []] = useContactGroups();
    const [initialModel, setInitialModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [model, setModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [uid] = useState(generateUID('contactGroupDropdown'));
    const applyGroups = useApplyGroups();

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
        createModal(
            <ContactGroupModal
                selectedContactEmails={contactEmails}
                onDelayedSave={onDelayedSave ? handleCreateContactGroup : undefined}
            />
        );
        close();
    };

    const handleApply = async () => {
        const changes = Object.entries(model).reduce<{ [groupID: string]: boolean }>((acc, [groupID, isChecked]) => {
            if (isChecked !== initialModel[groupID]) {
                acc[groupID] = isChecked === CHECKED;
            }
            return acc;
        }, {});

        if (onDelayedSave) {
            onDelayedSave(changes);
        } else {
            await applyGroups(contactEmails, changes);
        }

        close();
    };

    useEffect(() => {
        if (isOpen) {
            const initialModel = getModel(contactGroups, contactEmails);
            setInitialModel(initialModel);
            setModel(initialModel);
        }
    }, [contactGroups, contactEmails, isOpen]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await withLoading(handleApply());
    };

    return (
        <>
            <Tooltip title={tooltip}>
                <DropdownButton
                    as={forToolbar ? 'button' : Button}
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    disabled={disabled}
                    caretClassName={forToolbar ? 'toolbar-icon' : ''}
                    className={classnames([
                        forToolbar && 'toolbar-button toolbar-button--dropdown',
                        'flex flex-align-items-center',
                        className,
                    ])}
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
                noMaxSize
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-justify-space-between flex-align-items-center m1 mb0">
                        <strong>{c('Label').t`Add to group`}</strong>
                        <Tooltip title={c('Info').t`Create a new contact group`}>
                            <Button
                                icon
                                size="small"
                                onClick={handleAdd}
                                className="flex flex-align-items-center"
                                data-prevent-arrow-navigation
                            >
                                <Icon name="contacts-groups" /> +
                            </Button>
                        </Tooltip>
                    </div>
                    <div className="m1 mb0">
                        <SearchInput
                            value={keyword}
                            onChange={setKeyword}
                            autoFocus
                            placeholder={c('Placeholder').t`Filter groups`}
                            data-prevent-arrow-navigation
                        />
                    </div>
                    <div className="scroll-if-needed scroll-smooth-touch mt1 contactGroupDropdown-list-container">
                        {filteredContactGroups.length ? (
                            <ul className="unstyled mt0 mb0">
                                {filteredContactGroups.map(({ ID, Name, Color }) => {
                                    const checkboxId = `${uid}${ID}`;
                                    return (
                                        <li
                                            key={ID}
                                            className="dropdown-item w100 flex flex-nowrap flex-align-items-center pt0-5 pb0-5 pl1 pr1"
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
                                            >
                                                <Icon
                                                    name="circle"
                                                    className="ml0-25 mr0-5 flex-item-noshrink"
                                                    size={12}
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
                            <div className="w100 flex flex-nowrap flex-align-items-center pt0-5 pb0-5 pl1 pr1">
                                <Icon name="attention" className="mr0-5" />
                                {c('Info').t`No group found`}
                            </div>
                        ) : null}
                    </div>
                    <div className="m1">
                        <Button
                            color="norm"
                            fullWidth
                            loading={loading}
                            disabled={!filteredContactGroups.length}
                            data-prevent-arrow-navigation
                            type="submit"
                        >
                            {c('Action').t`Apply`}
                        </Button>
                    </div>
                </form>
            </Dropdown>
        </>
    );
};

export default ContactGroupDropdown;
