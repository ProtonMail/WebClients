import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Icon, useActiveBreakpoint, useToggle } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { recipientsToRecipientOrGroup } from '../../../helpers/message/messageRecipients';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ItemDate from '../../list/ItemDate';
import ExtraImages from '../../message/extras/ExtraImages';
import MailRecipients from '../../message/recipients/MailRecipients';
import RecipientItem from '../../message/recipients/RecipientItem';
import RecipientType from '../../message/recipients/RecipientType';
import EOExpirationTime from './EOExpirationTime';

interface Props {
    labelID: string;
    message: MessageState;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    parentMessageRef: React.RefObject<HTMLElement>;
}

const EOHeaderExpanded = ({
    labelID,
    message,
    messageLoaded,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    parentMessageRef,
}: Props) => {
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    const breakpoints = useActiveBreakpoint();
    const recipients = getRecipients(message.data);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients);

    const handleAttachmentIconClick = (e: MouseEvent) => {
        e.stopPropagation();
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    return (
        <div
            className={clsx([
                'message-header eo-message-header px-7 sm:px-0 message-header-expanded is-outbound border-bottom',
                showDetails && 'message-header--showDetails',
                !messageLoaded && 'is-loading',
            ])}
            data-testid={`message-header-expanded:${message.data?.Subject}`}
        >
            <div className="flex flex-nowrap items-center mx-0 mb-3 sm:mx-8">
                <span className="flex flex-1 flex-nowrap mr-2">
                    <div className={clsx(['flex flex-nowrap', !messageLoaded && 'flex-1'])}>
                        <RecipientType
                            label={c('Label Recipient').t`From`}
                            className={clsx(['flex items-start flex-nowrap', !messageLoaded && 'flex-1'])}
                        >
                            <RecipientItem
                                recipientOrGroup={{ recipient: message.data?.Sender }}
                                isLoading={!messageLoaded}
                                isOutside
                                onContactDetails={noop}
                                onContactEdit={noop}
                            />
                        </RecipientType>
                    </div>
                </span>
                <div
                    className="message-header-metas-container flex items-center shrink-0"
                    data-testid="message:message-header-metas"
                >
                    {messageLoaded && (
                        <>
                            <span>
                                <ItemAttachmentIcon
                                    onClick={handleAttachmentIconClick}
                                    element={message.data}
                                    className="ml-2"
                                />
                            </span>
                            {!breakpoints.viewportWidth['<=small'] && (
                                <ItemDate className="ml-2" element={message.data} labelID={labelID} useTooltip />
                            )}
                        </>
                    )}
                    {!messageLoaded && <span className="message-header-metas ml-2 inline-flex" />}
                </div>
            </div>
            <div className="flex md:flex-nowrap items-center mx-0 sm:mx-8 mt-0 mb-4">
                <MailRecipients
                    message={message}
                    recipientsOrGroup={recipientsOrGroup}
                    isLoading={!messageLoaded}
                    isOutside
                    expanded={showDetails}
                    toggleDetails={toggleDetails}
                    onContactDetails={noop}
                    onContactEdit={noop}
                />
            </div>
            {showDetails && (
                <div className="my-2 mx-8 flex flex-nowrap color-weak">
                    <span className="self-center mr-2 text-ellipsis">
                        <ItemDate element={message.data} labelID={labelID} mode="full" useTooltip />
                    </span>
                </div>
            )}

            {!showDetails && breakpoints.viewportWidth['<=small'] && (
                <div className="flex justify-space-between items-center border-top mx-0 sm:mx-8 pt-2 mb-2">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap items-center">
                                <Icon name="calendar-grid" className="mx-2" />
                                <ItemDate element={message.data} labelID={labelID} useTooltip />
                            </div>
                        </>
                    ) : (
                        <span className="message-header-metas inline-flex" />
                    )}
                </div>
            )}

            <section className="message-header-extra border-top mx-0 sm:mx-8 pt-2">
                <div className="mt-2 flex flex-row message-banners-container">
                    {messageLoaded && <EOExpirationTime message={message} />}
                    <ExtraImages
                        messageImages={message.messageImages}
                        type="remote"
                        onLoadImages={onLoadRemoteImages}
                        mailSettings={EO_DEFAULT_MAILSETTINGS}
                    />
                    <ExtraImages
                        messageImages={message.messageImages}
                        type="embedded"
                        onLoadImages={onLoadEmbeddedImages}
                        mailSettings={EO_DEFAULT_MAILSETTINGS}
                    />
                </div>
            </section>
        </div>
    );
};

export default EOHeaderExpanded;
