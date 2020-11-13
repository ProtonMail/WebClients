import React from 'react';
import { c } from 'ttag';

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
    handleExport: () => void;
    handleDelete: () => void;
    handleEdit: (field?: string) => void;
    leftBlockWidth?: string;
    isPreview?: boolean;
}

const ContactSummary = ({
    properties,
    handleEdit,
    handleDelete,
    handleExport,
    isPreview,
    leftBlockWidth = 'w30',
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    const photo = getPreferredValue(properties, 'photo') as string;
    const name = getPreferredValue(properties, 'fn') as string;
    const email = getPreferredValue(properties, 'email');
    const tel = getPreferredValue(properties, 'tel');
    const adr = getPreferredValue(properties, 'adr') as string[];

    const summary = [
        {
            icon: 'email',
            component: email ? (
                <a href={`mailto:${email}`} title={`${email}`}>
                    {email}
                </a>
            ) : (
                !isPreview && (
                    <LinkButton className="p0" onClick={() => handleEdit('email')}>
                        {c('Action').t`Add email`}
                    </LinkButton>
                )
            ),
        },
        {
            icon: 'phone',
            component: tel ? (
                <a href={`tel:${tel}`}>{tel}</a>
            ) : (
                !isPreview && (
                    <LinkButton className="p0" onClick={() => handleEdit('tel')}>
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
                      <LinkButton className="p0" onClick={() => handleEdit('adr')}>
                          {c('Action').t`Add address`}
                      </LinkButton>
                  ),
        },
    ].filter(Boolean);

    return (
        <div className={classnames(['contactsummary-container border-bottom m1', !isNarrow && 'flex flex-nowrap'])}>
            <div className={classnames(['aligncenter contactsummary-photo-container pt0-5', leftBlockWidth])}>
                <ContactImageSummary photo={photo} name={name} />
            </div>
            <div className="pl1 flex-item-fluid">
                <h2 className="onmobile-aligncenter mb0 ellipsis" title={name}>
                    {name}
                </h2>
                <div className="onmobile-aligncenter">
                    <ul className="unstyled mt0-5 inbl">
                        {summary.map(({ icon, component }) => {
                            if (!component) {
                                return null;
                            }
                            return (
                                <li key={icon} className="contactsummary-list-item flex flex-nowrap flex-items-center">
                                    <Icon name={icon} className="mr0-5 flex-item-noshrink" />
                                    <span className="ellipsis">{component}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {!isPreview && (
                <div className="flex-item-noshrink pt0-5 onmobile-aligncenter mb1">
                    <Tooltip title={c('Action').t`Edit`} className="ml0-5">
                        <Button onClick={() => handleEdit()} className="pm-button--for-icon inline-flex">
                            <Icon className="color-primary mt0-25 mb0-1" name="pen" alt={c('Action').t`Edit`} />
                        </Button>
                    </Tooltip>

                    <Tooltip title={c('Action').t`Export`} className="ml0-5">
                        <Button onClick={handleExport} className="pm-button--for-icon inline-flex">
                            <Icon className="mt0-25 mb0-1" name="export" alt={c('Action').t`Export`} />
                        </Button>
                    </Tooltip>

                    <Tooltip title={c('Action').t`Delete`} className="ml0-5">
                        <Button onClick={handleDelete} className="pm-button--for-icon inline-flex">
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
