import React, { useState, useEffect, useMemo, ReactNode, ChangeEvent } from 'react';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts/Contact';
import ContactGroupDropdownButton from '../../components/contacts/ContactGroupDropdownButton';
import { usePopperAnchor } from '../../components/popper';
import { useLoading, useContactGroups, useModals } from '../../hooks';
import { generateUID } from '../../helpers';
import Dropdown from '../../components/dropdown/Dropdown';
import Tooltip from '../../components/tooltip/Tooltip';
import Icon from '../../components/icon/Icon';
import SearchInput from '../../components/input/SearchInput';
import { SmallButton, PrimaryButton } from '../../components/button';
import Mark from '../../components/text/Mark';
import Checkbox from '../../components/input/Checkbox';
import ContactGroupModal from './modals/ContactGroupModal';
import useApplyGroups from './useApplyGroups';

import './ContactGroupDropdown.scss';

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

interface Props {
    children: ReactNode;
    className: string;
    disabled?: boolean;
    contactEmails: ContactEmail[];
    forToolbar?: boolean;
}

const ContactGroupDropdown = ({ children, className, contactEmails, disabled = false, forToolbar = false }: Props) => {
    const [keyword, setKeyword] = useState('');
    const [loading, withLoading] = useLoading();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const { createModal } = useModals();
    const [contactGroups = []] = useContactGroups();
    const [initialModel, setInitialModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [model, setModel] = useState<{ [groupID: string]: number }>(Object.create(null));
    const [uid] = useState(generateUID('contactGroupDropdown'));
    const applyGroups = useApplyGroups();

    const handleAdd = () => {
        createModal(<ContactGroupModal selectedContactEmails={contactEmails} />);
        close();
    };
    const handleCheck = (contactGroupID: string) => ({ target }: ChangeEvent<HTMLInputElement>) =>
        setModel({ ...model, [contactGroupID]: +target.checked });

    const handleApply = async () => {
        const changes = Object.entries(model).reduce<{ [groupID: string]: boolean }>((acc, [groupID, isChecked]) => {
            if (isChecked !== initialModel[groupID]) {
                acc[groupID] = isChecked === CHECKED;
            }
            return acc;
        }, {});

        await applyGroups(contactEmails, changes);

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

    return (
        <>
            <ContactGroupDropdownButton
                caretClassName={forToolbar ? 'toolbar-icon' : ''}
                className={className}
                disabled={disabled}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            >
                {children}
            </ContactGroupDropdownButton>
            <Dropdown
                id="contact-group-dropdown"
                className="contactGroupDropdown"
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                autoClose={false}
                noMaxSize
            >
                <div className="flex flex-justify-space-between flex-align-items-center m1 mb0">
                    <strong>{c('Label').t`Add to group`}</strong>
                    <Tooltip title={c('Info').t`Create a new contact group`}>
                        <SmallButton className="button--primary button--for-icon" onClick={handleAdd}>
                            <Icon name="contacts-groups" />+
                        </SmallButton>
                    </Tooltip>
                </div>
                <div className="m1 mb0">
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        autoFocus
                        placeholder={c('Placeholder').t`Filter groups`}
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
                    <PrimaryButton
                        className="w100"
                        loading={loading}
                        disabled={!filteredContactGroups.length}
                        onClick={() => withLoading(handleApply())}
                    >
                        {c('Action').t`Apply`}
                    </PrimaryButton>
                </div>
            </Dropdown>
        </>
    );
};

export default ContactGroupDropdown;
