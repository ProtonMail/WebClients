import { CSSProperties, ChangeEvent, useState } from 'react';
import { c, msgid } from 'ttag';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { classnames } from '../../helpers';
import { ItemCheckbox } from '../items';

interface Props {
    checked: boolean;
    onClick: (ID: string) => void;
    onCheck: (event: ChangeEvent) => void;
    style: CSSProperties;
    groupsEmailsMap: SimpleMap<ContactEmail[]>;
    group: ContactGroup;
    index: number;
    onFocus: (index: number) => void;
}

const ContactGroupRow = ({ checked, style, groupsEmailsMap, group, onClick, onCheck, index, onFocus }: Props) => {
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
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
        <div
            key={ID}
            style={style}
            onClick={() => onClick(ID)}
            className={classnames([
                'item-container item-contact flex cursor-pointer bg-global-white',
                hasFocus && 'item-is-focused',
            ])}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={-1}
            data-element-id={group.ID}
            data-shortcut-target="contact-container"
        >
            <div className="flex flex-nowrap w100 h100 mtauto mbauto flex-align-items-center">
                <ItemCheckbox
                    ID={ID}
                    name={Name}
                    checked={checked}
                    onChange={onCheck}
                    normalClassName="flex-item-noshrink"
                    compactClassName="flex-item-noshrink"
                />
                <span className="max-w100 flex pl1 pr1">
                    <span
                        role="heading"
                        aria-level={2}
                        className="inline-block pl1 pr1 pt0-25 pb0-25 rounded1e color-white text-ellipsis"
                        style={{ backgroundColor: Color }}
                    >
                        {Name}
                    </span>
                </span>
                <span className="flex-item-noshrink">
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
    );
};

export default ContactGroupRow;
