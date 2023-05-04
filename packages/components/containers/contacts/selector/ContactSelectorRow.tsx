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
                    'flex flex-nowrap flex-item-fluid h100 my-auto contact-list-row pl1 pr1',
                    checked && 'contact-list-row--selected',
                ])}
            >
                <Checkbox
                    labelProps={{ 'data-testid': `contact-checkbox-${contact.Email}` }}
                    className="flex-nowrap w100 h100"
                    checked={checked}
                    onChange={(e) => onCheck(e, contact.ID)}
                    aria-describedby={contact.ID}
                    id={contact.ID}
                >
                    <div
                        className={clsx(['flex-item-fluid flex-align-items-center max-w100 h100', !isNarrow && 'flex'])}
                    >
                        <div className={clsx(['pl1 flex', !isNarrow && 'w45'])}>
                            <span className="inline-block text-ellipsis max-w100 pr1">{contact.Name}</span>
                        </div>
                        <div className="flex-item-fluid flex on-mobile-pl1">
                            <span className="inline-block text-ellipsis max-w100 pr1">{contact.Email}</span>
                        </div>
                    </div>
                </Checkbox>
            </div>
        </div>
    );
};

export default ContactSelectorRow;
