import { Fragment, MouseEvent, memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Label, Tooltip } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { selectComposer } from '../../../logic/composers/composerSelectors';
import { useAppSelector } from '../../../logic/store';
import { RecipientType, recipientTypes } from '../../../models/address';
import { MapSendInfo, STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import AddressesCCButton from './AddressesCCButton';

interface Props {
    composerID: string;
    disabled: boolean;
    mapSendInfo?: MapSendInfo;
    onFocus: () => void;
    toggleExpanded: (type: RecipientType) => (e: MouseEvent<HTMLButtonElement>) => void;
    handleContactModal: (type: RecipientType) => () => Promise<void>;
}

const AddressesSummary = ({
    composerID,
    disabled,
    mapSendInfo,
    toggleExpanded,
    onFocus,
    handleContactModal,
}: Props) => {
    const { getRecipientsOrGroups, getRecipientsOrGroupsLabels, getRecipientOrGroupLabel } = useRecipientLabel();
    const composer = useAppSelector((store) => selectComposer(store, composerID));
    const recipients = getRecipients(composer.recipients);
    const title = getRecipientsOrGroupsLabels(getRecipientsOrGroups(recipients)).join(', ');

    return (
        <div className="flex flex-row flex-nowrap on-mobile-flex-column flex-align-items-center relative my-0">
            <Label
                className={clsx([
                    'composer-meta-label composer-meta-label-to pr-2 text-semibold',
                    disabled && 'placeholder',
                ])}
            >
                {c('Title').t`To`}
            </Label>
            <div
                className={clsx([
                    'field flex composer-addresses-fakefield composer-meta-fakefield-summary composer-light-field flex-row flex-align-items-center flex-nowrap flex-item-fluid w100',
                    disabled && 'disabled',
                ])}
                data-testid="composer:address"
            >
                <span
                    className="text-ellipsis flex-item-fluid composer-addresses-fakefield-inner pr-4"
                    title={title}
                    onClick={onFocus}
                    onFocus={onFocus}
                    role="button"
                    tabIndex={0}
                >
                    {recipients.length === 0 ? (
                        <span className="placeholder">{c('Placeholder').t`Email address`}</span>
                    ) : null}
                    {recipientTypes.map((type) => {
                        const recipients: Recipient[] = composer.recipients[type] || [];
                        if (recipients.length === 0) {
                            return null;
                        }
                        const recipientOrGroups = getRecipientsOrGroups(recipients);
                        return (
                            <Fragment key={type}>
                                {type === 'CCList' && (
                                    <span className="mr-2 color-primary" title={c('Title').t`Carbon Copy`}>
                                        {c('Title').t`CC`}:
                                    </span>
                                )}
                                {type === 'BCCList' && (
                                    <span
                                        className="mr-2 inline-flex color-primary"
                                        title={c('Title').t`Blind Carbon Copy`}
                                    >
                                        {c('Title').t`BCC`}:
                                    </span>
                                )}
                                {recipientOrGroups.map((recipientOrGroup, i) => {
                                    const Address = recipientOrGroup.recipient?.Address;
                                    const sendInfo = Address ? mapSendInfo?.[Address] : undefined;
                                    const icon = sendInfo?.sendIcon;
                                    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;

                                    return (
                                        <span
                                            key={i} // eslint-disable-line react/no-array-index-key
                                            className={clsx(['mr-2 align-top', cannotSend && 'color-danger'])}
                                        >
                                            <span>
                                                <span className="composer-addresses-addressIcon relative mr-1">
                                                    {icon && <EncryptionStatusIcon {...icon} disabled={disabled} />}
                                                </span>
                                                <span className="max-w100 text-ellipsis">
                                                    {getRecipientOrGroupLabel(recipientOrGroup)}
                                                </span>
                                            </span>
                                            {i !== recipientOrGroups.length - 1 && ','}
                                        </span>
                                    );
                                })}
                            </Fragment>
                        );
                    })}
                </span>
                <span className="flex flex-nowrap flex-item-noshrink on-mobile-max-w33 on-tiny-mobile-max-w50">
                    <AddressesCCButton
                        classNames="composer-addresses-ccbcc composer-addresses-ccbcc-fakefield text-ellipsis flex-item-noshrink"
                        disabled={disabled}
                        onClick={toggleExpanded('CCList')}
                        type="CCList"
                    />
                    <AddressesCCButton
                        classNames="composer-addresses-ccbcc composer-addresses-ccbcc-fakefield text-ellipsis flex-item-noshrink"
                        disabled={disabled}
                        onClick={toggleExpanded('BCCList')}
                        type="BCCList"
                    />
                    <Tooltip title={c('Action').t`Insert contacts`}>
                        <Button
                            type="button"
                            tabIndex={-1}
                            onClick={handleContactModal('ToList')}
                            color="weak"
                            className="py-1 flex-item-noshrink"
                            shape="ghost"
                            icon
                            data-testid="composer:to-button"
                        >
                            <Icon name="user-plus" size={16} alt={c('Title').t`To`} />
                        </Button>
                    </Tooltip>
                </span>
            </div>
        </div>
    );
};

export default memo(AddressesSummary);
