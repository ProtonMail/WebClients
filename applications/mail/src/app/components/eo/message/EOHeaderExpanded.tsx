import { classnames, Icon, useToggle } from '@proton/components';
import { MouseEvent } from 'react';
import { c } from 'ttag';

import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { Breakpoints } from '../../../models/utils';
import { recipientsToRecipientOrGroup } from '../../../helpers/addresses';
import RecipientItem from '../../message/recipients/RecipientItem';
import RecipientType from '../../message/recipients/RecipientType';
import ItemDate from '../../list/ItemDate';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ExtraExpirationTime from '../../message/extras/ExtraExpirationTime';
import ExtraImages from '../../message/extras/ExtraImages';
import MailRecipients from '../../message/recipients/MailRecipients';

interface Props {
    labelID: string;
    message: MessageState;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    breakpoints: Breakpoints;
    parentMessageRef: React.RefObject<HTMLElement>;
}

const EOHeaderExpanded = ({
    labelID,
    message,
    messageLoaded,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    breakpoints,
    parentMessageRef,
}: Props) => {
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    const { isNarrow } = breakpoints;
    const recipients = getRecipients(message.data);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients);

    const handleAttachmentIconClick = (e: MouseEvent) => {
        e.stopPropagation();
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    return (
        <div
            className={classnames([
                'message-header eo-message-header message-header-expanded is-outbound border-bottom',
                showDetails && 'message-header--showDetails',
                !messageLoaded && 'is-loading',
            ])}
            data-testid={`message-header-expanded:${message.data?.Subject}`}
        >
            <div className="flex flex-nowrap flex-align-items-center mx1 mb0-85">
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    <div className={classnames(['flex flex-nowrap', !messageLoaded && 'flex-item-fluid'])}>
                        <RecipientType
                            label={c('Label').t`From`}
                            className={classnames([
                                'flex flex-align-items-start flex-nowrap',
                                !messageLoaded && 'flex-item-fluid',
                            ])}
                        >
                            <RecipientItem
                                recipientOrGroup={{ recipient: message.data?.Sender }}
                                isLoading={!messageLoaded}
                                isOutside
                            />
                        </RecipientType>
                    </div>
                </span>
                <div
                    className="message-header-metas-container flex flex-align-items-center flex-item-noshrink"
                    data-testid="message:message-header-metas"
                >
                    {messageLoaded && (
                        <>
                            <span>
                                <ItemAttachmentIcon
                                    onClick={handleAttachmentIconClick}
                                    element={message.data}
                                    className="ml0-5"
                                />
                            </span>
                            {!isNarrow && (
                                <ItemDate className="ml0-5" element={message.data} labelID={labelID} useTooltip />
                            )}
                        </>
                    )}
                    {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex" />}
                </div>
            </div>
            <div className="flex flex-nowrap flex-align-items-center m1 mt0 on-mobile-flex-wrap">
                <MailRecipients
                    message={message}
                    recipientsOrGroup={recipientsOrGroup}
                    isLoading={!messageLoaded}
                    isOutside
                    expanded={showDetails}
                    toggleDetails={toggleDetails}
                />
            </div>
            {showDetails && (
                <div className="m0-5 mx1 flex flex-nowrap color-weak">
                    <span className="flex-align-self-center mr0-5 text-ellipsis">
                        <ItemDate element={message.data} labelID={labelID} mode="full" useTooltip />
                    </span>
                </div>
            )}

            {!showDetails && isNarrow && (
                <div className="flex flex-justify-space-between flex-align-items-center mx1 border-top pt0-5 mb0-5">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap flex-align-items-center">
                                <Icon name="calendar-days" className="ml0-5 mr0-5" />
                                <ItemDate element={message.data} labelID={labelID} useTooltip />
                            </div>
                        </>
                    ) : (
                        <span className="message-header-metas inline-flex" />
                    )}
                </div>
            )}

            <section className="message-header-extra border-top pt0-5 mx1">
                <div className="mt0-5 flex flex-row">
                    {messageLoaded && <ExtraExpirationTime message={message} displayAsButton />}
                    <ExtraImages
                        message={message}
                        type="remote"
                        onLoadImages={onLoadRemoteImages}
                        mailSettings={eoDefaultMailSettings}
                    />
                    <ExtraImages
                        message={message}
                        type="embedded"
                        onLoadImages={onLoadEmbeddedImages}
                        mailSettings={eoDefaultMailSettings}
                    />
                </div>
            </section>
        </div>
    );
};

export default EOHeaderExpanded;
