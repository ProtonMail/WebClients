import { Fragment, MouseEvent, memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Label, Tooltip } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useMailSelector } from 'proton-mail/store/hooks';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { RecipientType, recipientTypes } from '../../../models/address';
import { MapSendInfo, STATUS_ICONS_FILLS } from '../../../models/crypto';
import { selectComposer } from '../../../store/composers/composerSelectors';
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
    const composer = useMailSelector((store) => selectComposer(store, composerID));
    const recipients = getRecipients(composer.recipients);
    const title = getRecipientsOrGroupsLabels(getRecipientsOrGroups(recipients)).join(', ');

    return (
        <div className="flex flex-row flex-nowrap flex-column md:flex-row items-center relative my-0">
            <Label
                className={clsx([
                    'composer-meta-label composer-meta-label-to sr-only pr-2 text-semibold',
                    disabled && 'placeholder',
                ])}
            >
                {c('Title').t`To`}
            </Label>
            <div
                className={clsx([
                    'field flex composer-addresses-fakefield composer-meta-fakefield-summary composer-light-field flex-row items-center flex-nowrap flex-1 w-full',
                    disabled && 'disabled',
                ])}
                data-testid="composer:address"
            >
                <span
                    className="text-ellipsis flex-1 composer-addresses-fakefield-inner pr-4"
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
                                                <span className="max-w-full text-ellipsis">
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
                <span className="flex flex-nowrap shrink-0 max-w-1/2 sm:max-w-1/3 md:max-w-none">
                    <AddressesCCButton
                        classNames="composer-addresses-ccbcc composer-addresses-ccbcc-fakefield text-ellipsis shrink-0"
                        disabled={disabled}
                        onClick={toggleExpanded('CCList')}
                        type="CCList"
                    />
                    <AddressesCCButton
                        classNames="composer-addresses-ccbcc composer-addresses-ccbcc-fakefield text-ellipsis shrink-0"
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
                            className="py-1 shrink-0"
                            shape="ghost"
                            icon
                            data-testid="composer:to-button"
                        >
                            <Icon name="user-plus" size={4} alt={c('Title').t`To`} />
                        </Button>
                    </Tooltip>
                </span>
            </div>
        </div>
    );
};

export default memo(AddressesSummary);
