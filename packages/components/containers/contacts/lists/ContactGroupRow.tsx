import { CSSProperties, ChangeEvent, MouseEvent, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Checkbox, Icon, Tooltip } from '@proton/components/components';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';

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

    return (
        <div
            key={ID}
            style={style}
            onClick={() => onClick(ID)}
            className={clsx([
                'item-container item-contact flex cursor-pointer bg-global-white',
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
            <div className="flex flex-nowrap w100 h100 my-auto flex-align-items-center pl-2">
                <Checkbox
                    id={ID}
                    name={Name}
                    checked={checked}
                    onChange={onCheck}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="flex flex-column flex-item-fluid flex-justify-space-between mt-6">
                    <span className="w100 flex pl-4 pr-4">
                        <span
                            role="heading"
                            aria-level={2}
                            className="text-sm text-semibold inline-block px-3 py-0 rounded-full text-ellipsis"
                            style={{ backgroundColor: Color, color: 'white' }}
                        >
                            {Name}
                        </span>
                    </span>
                    <span className="pl-4 mt-0.5 flex-item-noshrink text-sm">
                        {addressCount === 0
                            ? c('Info').t`No email address`
                            : c('Info').ngettext(
                                  msgid`${addressCount} email address`,
                                  `${addressCount} email addresses`,
                                  addressCount
                              )}
                    </span>
                </div>
                {onCompose && addressCount > 0 && (
                    <div className="item-hover-action-buttons">
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
