import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { formatImage } from 'proton-shared/lib/helpers/image';
import { getPreferredValue } from 'proton-shared/lib/contacts/properties';
import { formatAdr } from 'proton-shared/lib/contacts/property';
import { ContactProperties } from 'proton-shared/lib/interfaces/contacts';

import ContactImageSummary from './ContactImageSummary';
import './ContactSummary.scss';
import Tooltip from '../tooltip/Tooltip';
import { Button, LinkButton } from '../button';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';

interface Props {
    properties: ContactProperties;
    onExport: () => void;
    onDelete: () => void;
    onEdit: (field?: string) => void;
    leftBlockWidth?: string;
    isPreview?: boolean;
    hasError?: boolean;
}

const ContactSummary = ({
    properties,
    onEdit,
    onDelete,
    onExport,
    isPreview,
    leftBlockWidth = 'w30',
    hasError = false,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const photo = formatImage(getPreferredValue(properties, 'photo') as string);
    const name = getPreferredValue(properties, 'fn') as string;
    const email = getPreferredValue(properties, 'email');
    const tel = getPreferredValue(properties, 'tel');
    const adr = getPreferredValue(properties, 'adr') as string[];

    const summary: { icon: string; component: ReactNode }[] = [
        {
            icon: 'email',
            component: email ? (
                <a href={`mailto:${email}`} title={`${email}`}>
                    {email}
                </a>
            ) : (
                !isPreview && (
                    <LinkButton className="p0" onClick={() => onEdit('email')}>
                        {c('Action').t`Add email`}
                    </LinkButton>
                )
            ),
        },
    ];

    if (!hasError) {
        summary.push(
            {
                icon: 'phone',
                component: tel ? (
                    <a href={`tel:${tel}`}>{tel}</a>
                ) : (
                    !isPreview && (
                        <LinkButton className="p0" onClick={() => onEdit('tel')}>
                            {c('Action').t`Add phone number`}
                        </LinkButton>
                    )
                ),
            },
            {
                icon: 'address',
                component: adr
                    ? formatAdr(adr)
                    : !isPreview && (
                          <LinkButton className="p0" onClick={() => onEdit('adr')}>
                              {c('Action').t`Add address`}
                          </LinkButton>
                      ),
            }
        );
    }

    return (
        <div className={classnames(['contactsummary-container mt1 mb1', !isNarrow && 'flex flex-nowrap'])}>
            <div className={classnames(['text-center contactsummary-photo-container pt0-5', leftBlockWidth])}>
                <ContactImageSummary photo={photo} name={name} />
            </div>
            <div className="pl1 flex-item-fluid">
                <h2 className="on-mobile-text-center mb0 text-ellipsis" title={name}>
                    {name}
                </h2>
                <div className="on-mobile-text-center">
                    <ul className="unstyled mt0-5 inline-block">
                        {summary.map(({ icon, component }) => {
                            if (!component) {
                                return null;
                            }
                            return (
                                <li
                                    key={icon}
                                    className="contactsummary-list-item flex flex-nowrap flex-align-items-center"
                                >
                                    <Icon name={icon} className="mr0-5 flex-item-noshrink" />
                                    <span className="text-ellipsis">{component}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {!isPreview && (
                <div className="flex-item-noshrink pt0-5 on-mobile-text-center mb1">
                    {!hasError && (
                        <Tooltip title={c('Action').t`Edit`} className="ml0-5">
                            <Button onClick={() => onEdit()} className="button--for-icon inline-flex">
                                <Icon className="color-primary mt0-25 mb0-1" name="pen" alt={c('Action').t`Edit`} />
                            </Button>
                        </Tooltip>
                    )}

                    {!hasError && (
                        <Tooltip title={c('Action').t`Export`} className="ml0-5">
                            <Button onClick={onExport} className="button--for-icon inline-flex">
                                <Icon className="mt0-25 mb0-1" name="export" alt={c('Action').t`Export`} />
                            </Button>
                        </Tooltip>
                    )}

                    <Tooltip title={c('Action').t`Delete`} className="ml0-5">
                        <Button onClick={onDelete} className="button--for-icon inline-flex">
                            <Icon
                                className="color-global-warning mt0-25 mb0-1"
                                name="trash"
                                alt={c('Action').t`Delete`}
                            />
                        </Button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default ContactSummary;
