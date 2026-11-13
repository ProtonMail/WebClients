import { c, msgid } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import {
    type FileAnalysisLimitNotice,
    type FileAnalysisShortfall,
    clearFileAnalysisLimitNotice,
    useFileAnalysisLimitNotice,
} from '../../services/fileAnalysisAllowance';
import { type ConversationId, LUMO_API_ERRORS, LUMO_USER_TYPE } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import ChatContainerItem from '../ChatContainerItem';

/**
 * `staged`: the file is in the composer and sending is held back. `stopped`: a send was stopped
 * before reading (a file named in the message rather than attached, or limits that changed).
 * `skipped`: the reply asked to read the file (analyze_file) and answered without it.
 */
type Stage = 'staged' | FileAnalysisLimitNotice['stage'];

interface CardProps {
    shortfall: FileAnalysisShortfall;
    stage: Stage;
    onDismiss?: () => void;
}

/** Explains that reading the file needs more Lite questions than are left, then offers the usual upgrade. */
export const FileAnalysisLimitCard = ({ shortfall, stage, onDismiss }: CardProps) => {
    const { hasLumoPlus, lumoUserType } = useLumoPlan();

    if (hasLumoPlus || lumoUserType === LUMO_USER_TYPE.PAID) {
        return null;
    }

    // Deliberately vague: no counts, only that reading this file takes more than the plan has left right now.
    const fileCount = shortfall.fileNames.length;
    const reasonByStage: Record<Stage, string> = {
        staged: c('collider_2025: Error Message').ngettext(
            msgid`Reading this file takes more processing than your plan has left. Remove it to send your message.`,
            `Reading these files takes more processing than your plan has left. Remove them to send your message.`,
            fileCount
        ),
        stopped: c('collider_2025: Error Message').ngettext(
            msgid`Reading this file takes more processing than your plan has left, so ${LUMO_SHORT_APP_NAME} didn't start.`,
            `Reading these files takes more processing than your plan has left, so ${LUMO_SHORT_APP_NAME} didn't start.`,
            fileCount
        ),
        skipped: c('collider_2025: Error Message').ngettext(
            msgid`Reading all of this file takes more processing than your plan has left, so ${LUMO_SHORT_APP_NAME} answered without reading all of it.`,
            `Reading all of these files takes more processing than your plan has left, so ${LUMO_SHORT_APP_NAME} answered without reading all of them.`,
            fileCount
        ),
    };
    const reason = reasonByStage[stage];
    const isGuest = lumoUserType === LUMO_USER_TYPE.GUEST;
    const title = isGuest
        ? c('collider_2025: Error Title').t`Sign up to work with larger files`
        : c('collider_2025: Error Title').t`Upgrade to work with larger files`;
    const offer = isGuest
        ? c('collider_2025: Error Message').t`Sign up for free to work with larger files.`
        : c('collider_2025: Error Message').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus to work with large files.`;

    return (
        <UpsellCard
            showSadCat={false}
            inChat={stage !== 'staged'}
            error={{
                userType: lumoUserType,
                errorTitle: title,
                errorMessage: `${reason} ${offer}`,
                errorType: LUMO_API_ERRORS.TIER_LIMIT,
                timestamp: 0,
            }}
            onDismiss={onDismiss}
        />
    );
};

interface Props {
    conversationId: ConversationId | undefined;
}

/** In the chat, after a send stopped before reading a large file. */
export const FileAnalysisLimitUpsell = ({ conversationId }: Props) => {
    const notice = useFileAnalysisLimitNotice(conversationId);

    if (!notice || !conversationId) {
        return null;
    }

    return (
        <ChatContainerItem className="px-2">
            <FileAnalysisLimitCard
                shortfall={notice}
                stage={notice.stage}
                onDismiss={() => {
                    clearFileAnalysisLimitNotice(conversationId);
                }}
            />
        </ChatContainerItem>
    );
};
