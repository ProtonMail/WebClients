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
import { classnames } from '../../helpers/component';
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
        <div className={classnames(['contactsummary-container p1 mb1', !isNarrow && 'flex flex-nowrap'])}>
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
                <div className="flex-item-noshrink pt0-5 onmobile-aligncenter">
                    <Button onClick={() => handleEdit()} className="ml0-5 pm-button--for-icon">
                        <Tooltip title={c('Action').t`Edit`} className="color-primary">
                            <Icon name="pen" />
                        </Tooltip>
                    </Button>

                    <Button onClick={handleExport} className="ml0-5 pm-button--for-icon">
                        <Tooltip title={c('Action').t`Export`}>
                            <Icon name="export" />
                        </Tooltip>
                    </Button>

                    <Button onClick={handleDelete} className="ml0-5 pm-button--for-icon">
                        <Tooltip title={c('Action').t`Delete`} className="color-global-warning">
                            <Icon name="trash" />
                        </Tooltip>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ContactSummary;
