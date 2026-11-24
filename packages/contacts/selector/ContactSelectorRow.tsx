import type { CSSProperties, ChangeEvent } from 'react';

import Checkbox from '@proton/components/components/input/Checkbox';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import clsx from '@proton/utils/clsx';

interface Props {
    style: CSSProperties;
    onCheck: (e: ChangeEvent<HTMLInputElement>, contactID: string) => void;
    contact: ContactEmail;
    checked: boolean;
    isSmallViewport: boolean;
}

const ContactSelectorRow = ({ style, onCheck, contact, checked, isSmallViewport }: Props) => {
    return (
        <div style={style} className="flex">
            <div
                className={clsx([
                    'flex flex-nowrap flex-1 h-full my-auto contact-list-row px-4',
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
                    <div className={clsx(['flex-1 items-center max-w-full h-full', !isSmallViewport && 'flex'])}>
                        <div
                            className={clsx(['pl-4 flex', !isSmallViewport && 'w-custom'])}
                            style={!isSmallViewport ? { '--w-custom': '45%' } : undefined}
                        >
                            <span className="inline-block text-ellipsis max-w-full pr-4">{contact.Name}</span>
                        </div>
                        <div className="flex-1 flex pl-4 md:pl-0">
                            <span className="inline-block text-ellipsis max-w-full pr-4">{contact.Email}</span>
                        </div>
                    </div>
                </Checkbox>
            </div>
        </div>
    );
};

export default ContactSelectorRow;
