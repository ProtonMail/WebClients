import { c } from 'ttag';

import ProtonSentinelUpsellModal from '@proton/components/components/drawer/views/SecurityCenter/ProtonSentinel/modal/ProtonSentinelUpsellModal';
import { useModalStateObject } from '@proton/components/components/modalTwo';
import { AutoDeleteUpsellModal, LabelsUpsellModal, PmMeUpsellModal } from '@proton/components/components/upsell';
import IncreasePrivacyUpsellModal from '@proton/components/components/upsell/modal/types/IncreasePrivacyUpsellModal';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { useApi, useEventManager, useNotifications, useUser } from '@proton/components/hooks';
import { useFolders, useLabels } from '@proton/components/hooks/useCategories';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAIL_UPSELL_PATHS, ROOT_FOLDER, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import { MESSAGE_ACTIONS } from 'proton-mail/constants';
import { useOnCompose } from 'proton-mail/containers/ComposeProvider';
import { ComposeTypes } from 'proton-mail/hooks/composer/useCompose';
import usePremiumAddress from 'proton-mail/hooks/usePremiumAddress';
import { TipActionType } from 'proton-mail/models/tip';
import { elements } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { snoozeActions } from 'proton-mail/store/snooze/snoozeSlice';

import useProtonTipsTelemetry from './useProtonTipsTelemetry';

const MAX_LABEL_COUNT_FOR_FREE_USER = 3;
const SUGGESTED_FOLDER_NAME = 'Receipts';
const SUGGESTED_LABEL_NAME = 'To pay';

interface Props {
    actionType: TipActionType;
}

const hasSettingsUrlTypes = new Set([
    TipActionType.CreateEmailAddress,
    TipActionType.EnableDarkWebMonitoring,
    TipActionType.DownloadDesktopApp,
]);

const useTipConfig = ({ actionType }: Props) => {
    const api = useApi();
    const [user] = useUser();
    const [folders] = useFolders();
    const [labels] = useLabels();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const onCompose = useOnCompose();
    const { createPremiumAddress, loadingProtonDomains } = usePremiumAddress();
    const dispatch = useMailDispatch();
    const mailboxElements = useMailSelector(elements);
    const { sendCTAButtonClickedReport } = useProtonTipsTelemetry();

    const labelsUpsellModal = useModalStateObject();
    const createLabelModal = useModalStateObject();
    const autoDeleteUpsellModal = useModalStateObject();
    const protonSentinelUpsellModal = useModalStateObject();
    const increasePrivacyUpsellModal = useModalStateObject();
    const pmMeUpsellModal = useModalStateObject();

    const renderFolderModals = () => {
        return (
            <>
                {labelsUpsellModal.render && (
                    <LabelsUpsellModal
                        modalProps={labelsUpsellModal.modalProps}
                        feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
                )}
                {createLabelModal.render && (
                    <EditLabelModal
                        {...createLabelModal.modalProps}
                        type="folder"
                        label={{
                            Name: SUGGESTED_FOLDER_NAME,
                            Color: getRandomAccentColor(),
                            Type: LABEL_TYPE.MESSAGE_FOLDER,
                            ParentID: ROOT_FOLDER,
                            Notify: 1,
                        }}
                    />
                )}
            </>
        );
    };

    const renderLabelModals = () => {
        return (
            <>
                {labelsUpsellModal.render && (
                    <LabelsUpsellModal
                        modalProps={labelsUpsellModal.modalProps}
                        feature={MAIL_UPSELL_PATHS.UNLIMITED_LABELS}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
                )}
                {createLabelModal.render && (
                    <EditLabelModal
                        {...createLabelModal.modalProps}
                        type="label"
                        label={{
                            Name: SUGGESTED_LABEL_NAME,
                            Color: getRandomAccentColor(),
                            Type: LABEL_TYPE.MESSAGE_LABEL,
                            ParentID: undefined,
                            Notify: 0,
                        }}
                    />
                )}
            </>
        );
    };

    const renderAutoDeleteUpsellModal = () => {
        return (
            <>
                {autoDeleteUpsellModal.render && (
                    <AutoDeleteUpsellModal
                        modalProps={autoDeleteUpsellModal.modalProps}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
                )}
            </>
        );
    };

    const renderIncreasePrivacyModal = () => {
        return (
            <>
                {increasePrivacyUpsellModal.render && (
                    <IncreasePrivacyUpsellModal
                        modalProps={increasePrivacyUpsellModal.modalProps}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
                )}
            </>
        );
    };

    const renderProtonSentialModal = () => {
        return (
            <>
                {protonSentinelUpsellModal.render && (
                    <ProtonSentinelUpsellModal
                        modalProps={protonSentinelUpsellModal.modalProps}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
                )}
            </>
        );
    };

    const renderPmMeUpsellModal = () => {
        return (
            <>
                {pmMeUpsellModal.render && (
                    <PmMeUpsellModal modalProps={pmMeUpsellModal.modalProps} upsellComponent={UPSELL_COMPONENT.TIP} />
                )}
            </>
        );
    };

    const renderModalContent = () => {
        switch (actionType) {
            case TipActionType.CreateFolder:
                return renderFolderModals();
            case TipActionType.CreateLabel:
                return renderLabelModals();
            case TipActionType.GetProtonSubdomainAddress:
                return renderPmMeUpsellModal();
            case TipActionType.ClearMailbox:
                return renderAutoDeleteUpsellModal();
            case TipActionType.CreateEmailAddress:
                return renderIncreasePrivacyModal();
            case TipActionType.EnableDarkWebMonitoring:
                return renderProtonSentialModal();
            default:
                return undefined;
        }
    };

    const isEligible = () => {
        switch (actionType) {
            case TipActionType.CreateFolder:
                return folders ? !(user.isFree && folders.length >= MAX_LABEL_COUNT_FOR_FREE_USER) : false;
            case TipActionType.CreateLabel:
                return labels ? !(user.isFree && labels.length >= MAX_LABEL_COUNT_FOR_FREE_USER) : false;
            case TipActionType.CreateAlias:
            case TipActionType.ScheduleMessage:
            case TipActionType.SnoozeEmail:
            case TipActionType.DownloadDesktopApp:
                return true;
            default:
                return user.isPaid;
        }
    };

    const shouldRedirectToSettingsUrl = () => {
        return isEligible() && hasSettingsUrlTypes.has(actionType);
    };

    const activateProtonSubdomainAddress = async () => {
        const Address = await createPremiumAddress();
        await call();
        createNotification({
            text: `${Address?.Email}` + c('Success notification').t` is now active`,
        });
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    };

    const activateAutoDeleteSpamAndTrash = async () => {
        await api(updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE));
        await call();
        createNotification({
            text: `Messages in Spam/Trash will automatically be deleted after 30 days.`,
        });
    };

    const onClick = async () => {
        const isUserEligible = isEligible();
        switch (actionType) {
            case TipActionType.CreateFolder:
                if (isUserEligible) {
                    createLabelModal.openModal(true);
                } else {
                    labelsUpsellModal.openModal(true);
                }
                break;
            case TipActionType.CreateLabel:
                if (isUserEligible) {
                    createLabelModal.openModal(true);
                } else {
                    labelsUpsellModal.openModal(true);
                }
                break;
            case TipActionType.GetProtonSubdomainAddress:
                if (isUserEligible) {
                    await activateProtonSubdomainAddress();
                } else {
                    pmMeUpsellModal.openModal(true);
                }
                break;
            case TipActionType.ScheduleMessage:
                void onCompose({
                    type: ComposeTypes.newMessage,
                    action: MESSAGE_ACTIONS.NEW,
                    forceOpenScheduleSend: true,
                });
                break;
            case TipActionType.ClearMailbox:
                if (isUserEligible) {
                    void activateAutoDeleteSpamAndTrash();
                } else {
                    autoDeleteUpsellModal.openModal(true);
                }
                break;
            case TipActionType.CreateEmailAddress:
                if (!isUserEligible) {
                    increasePrivacyUpsellModal.openModal(true);
                }
                break;
            case TipActionType.SnoozeEmail:
                dispatch(
                    snoozeActions.setSnoozeDropdown({
                        dropdownState: 'forceOpen',
                        element: mailboxElements[0],
                    })
                );
                break;
            case TipActionType.EnableDarkWebMonitoring:
                if (!isUserEligible) {
                    protonSentinelUpsellModal.openModal(true);
                }
                break;
            default:
                break;
        }
        sendCTAButtonClickedReport(actionType);
    };

    return {
        modalContent: renderModalContent(),
        onClick: onClick,
        redirectToSettings: shouldRedirectToSettingsUrl(),
        loadingProtonDomains,
        sendCTAButtonClickedReport,
    };
};

export default useTipConfig;
