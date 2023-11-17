import { CSSProperties, ChangeEvent } from 'react';

import { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import clsx from '@proton/utils/clsx';

import { Checkbox } from '../../../components';

interface Props {
    style: CSSProperties;
    onCheck: (e: ChangeEvent<HTMLInputElement>, contactID: string) => void;
    contact: ContactEmail;
    checked: boolean;
    isNarrow: boolean;
}

const ContactSelectorRow = ({ style, onCheck, contact, checked, isNarrow }: Props) => {
    return (
        <div style={style} className="flex">
            <div
                className={clsx([
                    'flex flex-nowrap flex-item-fluid h-full my-auto contact-list-row px-4',
                    checked && 'contact-list-row--selected',
                ])}
            >
                <Checkbox
                    labelProps={{ 'data-testid': `contact-checkbox-${contact.Email}` }}
                    className="flex-nowrap w-full h-full"
                    checked={checked}
                    onChange={(e) => onCheck(e, contact.ID)}
                    aria-describedby={contact.ID}
                    id={contact.ID}
                >
                    <div
                        className={clsx([
                            'flex-item-fluid items-center max-w-full h-full',
                            !isNarrow && 'flex',
                        ])}
                    >
                        <div
                            className={clsx(['pl-4 flex', !isNarrow && 'w-custom'])}
                            style={!isNarrow ? { '--w-custom': '45%' } : undefined}
                        >
                            <span className="inline-block text-ellipsis max-w-full pr-4">{contact.Name}</span>
                        </div>
                        <div className="flex-item-fluid flex pl-4 md:pl-0">
                            <span className="inline-block text-ellipsis max-w-full pr-4">{contact.Email}</span>
                        </div>
                    </div>
                </Checkbox>
            </div>
        </div>
    );
};

export default ContactSelectorRow;
