import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    AutoDeleteUpsellModal,
    DWMUpsellModal,
    EditLabelModal,
    LabelsUpsellModal,
    PmMeUpsellModal,
    useApi,
    useModalStateObject,
    useNotifications,
    useShortDomainAddress,
} from '@proton/components';
import IncreasePrivacyUpsellModal from '@proton/components/components/upsell/modals/IncreasePrivacyUpsellModal';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import {
    APP_UPSELL_REF_PATH,
    LABEL_TYPE,
    MAIL_UPSELL_PATHS,
    ROOT_FOLDER,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import { useOnCompose } from 'proton-mail/containers/ComposeProvider';
import { ComposeTypes } from 'proton-mail/hooks/composer/useCompose';
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
    const { createNotification } = useNotifications();
    const onCompose = useOnCompose();
    const dispatch = useDispatch();
    const dispatchMail = useMailDispatch();
    const mailboxElements = useMailSelector(elements);
    const { sendCTAButtonClickedReport } = useProtonTipsTelemetry();

    const labelsUpsellModal = useModalStateObject();
    const createLabelModal = useModalStateObject();
    const autoDeleteUpsellModal = useModalStateObject();
    const increasePrivacyUpsellModal = useModalStateObject();
    const pmMeUpsellModal = useModalStateObject();
    const dwmUpsellModal = useModalStateObject();
    const { createShortDomainAddress, loadingDependencies: loadingProtonDomains } = useShortDomainAddress();

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

    const renderPmMeUpsellModal = () => {
        return (
            <>
                {pmMeUpsellModal.render && (
                    <PmMeUpsellModal
                        modalProps={pmMeUpsellModal.modalProps}
                        upsellRefOptions={{
                            app: 'upsell_mail-',
                            component: 'tip-',
                            isSettings: false,
                        }}
                    />
                )}
            </>
        );
    };

    const renderDWMUpsellModal = () => {
        return (
            <>
                {dwmUpsellModal.render && (
                    <DWMUpsellModal
                        upsellApp={APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}
                        modalProps={dwmUpsellModal.modalProps}
                        upsellComponent={UPSELL_COMPONENT.TIP}
                    />
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
                return renderDWMUpsellModal();
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
        const Address = await createShortDomainAddress({ setDefault: false });
        createNotification({
            text: `${Address?.Email}` + c('Success notification').t` is now active`,
        });
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    };

    const activateAutoDeleteSpamAndTrash = async () => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE)
        );
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
                dispatchMail(
                    snoozeActions.setSnoozeDropdown({
                        dropdownState: 'forceOpen',
                        element: mailboxElements[0],
                    })
                );
                break;
            case TipActionType.EnableDarkWebMonitoring:
                if (!isUserEligible) {
                    dwmUpsellModal.openModal(true);
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
