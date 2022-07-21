import { memo, Fragment, MouseEvent, FocusEvent } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { c } from 'ttag';
import { Label, classnames, Button, Icon, Tooltip } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { MapSendInfo, STATUS_ICONS_FILLS } from '../../../models/crypto';
import { RecipientType, recipientTypes } from '../../../models/address';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    message: Message | undefined;
    disabled: boolean;
    mapSendInfo?: MapSendInfo;
    onFocus: () => void;
    toggleExpanded: (e: MouseEvent<HTMLButtonElement>) => void;
    handleContactModal: (type: RecipientType) => () => Promise<void>;
}

const AddressesSummary = ({ message, disabled, mapSendInfo, toggleExpanded, onFocus, handleContactModal }: Props) => {
    const { getRecipientsOrGroups, getRecipientsOrGroupsLabels, getRecipientOrGroupLabel } = useRecipientLabel();
    const title = getRecipientsOrGroupsLabels(getRecipientsOrGroups(getRecipients(message))).join(', ');

    // Fakefield onFocus takes precedence on the CcBcc button onClick which is not really logic
    // By catching and stoping the focus event propagation on that button, we restore the click handler
    const handleFocuButton = (event: FocusEvent) => {
        event.stopPropagation();
    };

    return (
        <div className="flex flex-row flex-nowrap on-mobile-flex-column flex-align-items-center relative mt0 mb0">
            <Label className={classnames(['composer-meta-label pr0-5 pt0 text-semibold', disabled && 'placeholder'])}>
                {c('Title').t`To`}
            </Label>
            <div
                className={classnames([
                    'field flex composer-addresses-fakefield composer-meta-fakefield-summary composer-light-field flex-row flex-align-items-center flex-nowrap flex-item-fluid w100',
                    disabled && 'disabled',
                ])}
                onClick={onFocus}
                onFocus={onFocus}
                tabIndex={0}
                role="button"
                data-testid="composer:address"
            >
                <span className="text-ellipsis flex-item-fluid composer-addresses-fakefield-inner pr1" title={title}>
                    {getRecipients(message).length === 0 ? (
                        <span className="placeholder">{c('Placeholder').t`Email address`}</span>
                    ) : null}
                    {recipientTypes.map((type) => {
                        const recipients: Recipient[] = message?.[type] || [];
                        if (recipients.length === 0) {
                            return null;
                        }
                        const recipientOrGroups = getRecipientsOrGroups(recipients);
                        return (
                            <Fragment key={type}>
                                {type === 'CCList' && (
                                    <span className="mr0-5 color-primary" title={c('Title').t`Carbon Copy`}>
                                        {c('Title').t`CC`}:
                                    </span>
                                )}
                                {type === 'BCCList' && (
                                    <span
                                        className="mr0-5 inline-flex color-primary"
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
                                            className={classnames(['mr0-5 align-top', cannotSend && 'color-danger'])}
                                        >
                                            <span>
                                                <span className="composer-addresses-addressIcon relative mr0-25">
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
                    <Button
                        color="norm"
                        shape="ghost"
                        size="small"
                        icon
                        title={c('Action').t`Carbon Copy, Blind Carbon Copy`}
                        onClick={toggleExpanded}
                        onFocus={handleFocuButton}
                        disabled={disabled}
                        className="composer-addresses-ccbcc text-left text-ellipsis composer-addresses-ccbcc-fakefield text-no-decoration flex-item-noshrink text-strong relative"
                    >
                        {c('Action').t`CC BCC`}
                    </Button>
                    <Tooltip title={c('Action').t`Insert contacts`}>
                        <Button
                            type="button"
                            onClick={handleContactModal('ToList')}
                            onFocus={handleFocuButton}
                            color="weak"
                            className="pt0-25 pb0-25 flex-item-noshrink"
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
