import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

import { MailShortcutsModal, PromotionBanner, ThemesModal, useModalState } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { MessageOption } from './useMailUpsellOption';
import useMailUpsellOption from './useMailUpsellOption';

interface Props {
    needToShowUpsellBanner: MutableRefObject<boolean>;
    columnMode: boolean;
    onClose: () => void;
}

const MailUpsellBanner = ({ needToShowUpsellBanner, columnMode, onClose }: Props) => {
    const [option, setOption] = useState<MessageOption>();

    const [mailShortcutsProps, setMailShortcutsModalOpen, renderShortcutModal] = useModalState();
    const [themesModalProps, setThemesModalOpen, renderThemesModal] = useModalState();

    const encounteredMessagesIDs = getItem('WelcomePaneEncounteredMessages');

    const messagesOptions = useMailUpsellOption({ setMailShortcutsModalOpen, setThemesModalOpen });

    const getRandomOption = (): MessageOption => {
        let hasSeenAllMessages = false;

        /*
         * Message options can contain less element than the localstorage in the case where the user has triggered a condition in the meantime
         * For example, if the user did not have any calendar items, and had all messages displayed, messageOptions now contains fewer items than the
         * localStorage array. Instead of checking if length are equals, check if every item of messageOptions have been encountered.
         */
        if (encounteredMessagesIDs) {
            const idsArray = JSON.parse(encounteredMessagesIDs);
            hasSeenAllMessages = messagesOptions.every((option) => idsArray.includes(option.id));
        }

        const encounteredMessages =
            !encounteredMessagesIDs || hasSeenAllMessages ? [] : JSON.parse(encounteredMessagesIDs);

        const filteredOptions = messagesOptions.filter((option) => !encounteredMessages.includes(option.id));

        // We should never have a filteredOptions empty, but in case it is, display the first option as a fallback
        const randomOption = filteredOptions.length
            ? filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
            : messagesOptions[0];
        setItem('WelcomePaneEncounteredMessages', JSON.stringify([...encounteredMessages, randomOption.id]));
        return randomOption;
    };

    useEffect(() => {
        try {
            setOption(getRandomOption());
        } catch (e: any) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        // On banner unmount, set the ref to false so that we don't show the banner anymore
        return () => {
            needToShowUpsellBanner.current = false;
        };
    }, []);

    return (
        <>
            <PromotionBanner
                description={option?.text}
                cta={option?.cta}
                contentCentered={!columnMode}
                data-testid="promotion-banner"
                hasDismissAction
                onClose={onClose}
            />
            {renderShortcutModal && <MailShortcutsModal {...mailShortcutsProps} />}
            {renderThemesModal && <ThemesModal {...themesModalProps} />}
        </>
    );
};

export default MailUpsellBanner;
