import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import ContactLabelProperty from '../ContactLabelProperty';
import EncryptedIcon from '../EncryptedIcon';

interface Props {
    field: string;
    type?: string;
    isSignatureVerified: boolean;
    children: ReactNode;
}

const ContactViewProperty = ({ field, type, isSignatureVerified, children }: Props) => {
    return (
        <div className="contact-view-row flex flex-nowrap flex-align-items-start mb-4">
            <div
                className={clsx(['contact-view-row-left flex flex-nowrap flex-item-fluid on-mobile-flex-column w100'])}
            >
                <div
                    className={clsx([
                        'contact-view-row-label flex-no-min-children on-mobile-max-w100 flex-item-noshrink flex-align-items-start label max-w100p',
                    ])}
                >
                    <div className="flex flex-item-noshrink flex-item-fluid flex-align-items-center max-w100">
                        <div role="heading" aria-level={3} className="mr-2">
                            <ContactLabelProperty field={field} type={type} />
                        </div>
                        {field && ['email', 'fn'].includes(field) ? null : (
                            <EncryptedIcon className="flex" isSignatureVerified={isSignatureVerified} />
                        )}
                    </div>
                </div>
                <span
                    className={clsx([
                        'contact-view-row-content mr-2 flex-item-fluid pt-2 pl-0 md:pl-7',
                        !['note'].includes(field) && 'text-ellipsis',
                        ['note'].includes(field) && 'text-pre-wrap',
                    ])}
                >
                    {children}
                </span>
            </div>
        </div>
    );
};

export default ContactViewProperty;
