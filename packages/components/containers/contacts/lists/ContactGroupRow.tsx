import type { CSSProperties, ChangeEvent, MouseEvent } from 'react';
import { useState } from 'react';

import tinycolor from 'tinycolor2';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import genAccentShades from '@proton/colors/gen-accent-shades';
import { Tooltip } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';

import ItemCheckbox from '../../items/ItemCheckbox';
import { ContactRowItemFirstLine, ContactRowItemSecondLine } from './ContactRowItem';

interface Props {
    checked: boolean;
    onClick: (ID: string) => void;
    onCheck: (event: ChangeEvent) => void;
    style: CSSProperties;
    groupsEmailsMap: SimpleMap<ContactEmail[]>;
    group: ContactGroup;
    index: number;
    onFocus: (index: number) => void;
    isDrawer?: boolean;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
}

const ContactGroupRow = ({
    checked,
    style,
    groupsEmailsMap,
    group,
    onClick,
    onCheck,
    index,
    onFocus,
    isDrawer = false,
    onCompose,
}: Props) => {
    const { ID, Name, Color } = group;
    const [hasFocus, setHasFocus] = useState(false);

    const addressCount = groupsEmailsMap[ID]?.length || 0;
    const colors = genAccentShades(tinycolor(Color)).map((c) => c.toHexString());

    const handleFocus = () => {
        setHasFocus(true);
        onFocus(index);
    };

    const handleBlur = () => {
        setHasFocus(false);
    };

    const handleCompose = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const recipients: Recipient[] =
            groupsEmailsMap[ID]?.map((contact) => ({ Name: contact.Name, Address: contact.Email })) || [];
        onCompose?.([...recipients], []);
    };

    const title =
        addressCount === 0
            ? c('Info').t`No email address`
            : c('Info').ngettext(msgid`${addressCount} email address`, `${addressCount} email addresses`, addressCount);

    return (
        <div
            key={ID}
            style={style}
            onClick={() => onClick(ID)}
            className={clsx([
                'contact-item-container item-contact flex cursor-pointer bg-global-white',
                hasFocus && 'item-is-focused',
                isDrawer && 'item-in-drawer',
            ])}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={group.ID}
            data-shortcut-target="contact-container"
            data-testid={`group-item:${group.Name}`}
        >
            <div className="flex flex-nowrap w-full h-full my-auto items-start">
                <ItemCheckbox
                    ID={ID}
                    name={Name}
                    checked={checked}
                    onChange={onCheck}
                    iconName="users"
                    color={checked ? colors[2] : Color}
                />
                <div className="flex-1 ml-2 conversation-titlesender">
                    <ContactRowItemFirstLine ID={ID} Name={Name} />

                    <ContactRowItemSecondLine title={title}>
                        {addressCount === 0
                            ? c('Info').t`No email address`
                            : c('Info').ngettext(
                                  msgid`${addressCount} email address`,
                                  `${addressCount} email addresses`,
                                  addressCount
                              )}
                    </ContactRowItemSecondLine>
                </div>

                {onCompose && addressCount > 0 && (
                    <div className="contact-item-hover-action-buttons">
                        <Tooltip title={c('Action').t`Compose`}>
                            <Button color="weak" shape="ghost" icon onClick={handleCompose}>
                                <Icon name="pen-square" alt={c('Action').t`Compose`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactGroupRow;
