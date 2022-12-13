import { CSSProperties, ChangeEvent, useState } from 'react';

import { c, msgid } from 'ttag';

import { Checkbox } from '@proton/components/components';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { classnames } from '../../../helpers';

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

    return (
        <div
            key={ID}
            style={style}
            onClick={() => onClick(ID)}
            className={classnames([
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
            <div className="flex flex-nowrap w100 h100 myauto flex-align-items-center pl0-5">
                <Checkbox
                    id={ID}
                    name={Name}
                    checked={checked}
                    onChange={onCheck}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="flex flex-column flex-item-fluid flex-justify-space-between mt1-5">
                    <span className="w100 flex pl1 pr1">
                        <span
                            role="heading"
                            aria-level={2}
                            className="text-sm text-semibold inline-block px0-75 py0 rounded-full text-ellipsis"
                            style={{ backgroundColor: Color, color: 'white' }}
                        >
                            {Name}
                        </span>
                    </span>
                    <span className="pl1 mt0-15 flex-item-noshrink text-sm">
                        {addressCount === 0
                            ? c('Info').t`No email address`
                            : c('Info').ngettext(
                                  msgid`${addressCount} email address`,
                                  `${addressCount} email addresses`,
                                  addressCount
                              )}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ContactGroupRow;
