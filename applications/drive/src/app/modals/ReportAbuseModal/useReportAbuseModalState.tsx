import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useApi, useNotifications } from '@proton/components';
import type { NodeType, ProtonDrivePublicLinkClient } from '@proton/drive';
import { querySubmitAbuseReport } from '@proton/shared/lib/api/drive/sharing';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import type { ReportAbuseModalViewProps } from './ReportAbuseModalView';
import { AbuseCategoryType, type AbuseReportPrefill } from './types';

type Drive = {
    getNode: ProtonDrivePublicLinkClient['getNode'];
    experimental: {
        getNodePassphrase: ProtonDrivePublicLinkClient['experimental']['getNodePassphrase'];
    };
};

export type UseReportAbuseModalProps = ModalStateProps & {
    drive: Drive;
    nodeUid: string;
    publicLinkUrl: string;
    publicLinkPassword: string;
    prefilled?: AbuseReportPrefill;
};

export const ABUSE_CATEGORIES = [
    {
        type: AbuseCategoryType.Spam,
        getText: () => c('Label').t`Spam`,
    },
    {
        type: AbuseCategoryType.Copyright,
        getText: () => c('Label').t`Copyright infringement`,
    },
    {
        type: AbuseCategoryType.ChildAbuse,
        getText: () => c('Label').t`Child sexual abuse material`,
    },
    {
        type: AbuseCategoryType.StolenData,
        getText: () => c('Label').t`Stolen data`,
    },
    {
        type: AbuseCategoryType.Malware,
        getText: () => c('Label').t`Malware`,
    },
    {
        type: AbuseCategoryType.Other,
        getText: () => c('Label').t`Other`,
    },
];

export const CATEGORIES_WITH_EMAIL_VERIFICATION: AbuseCategoryType[] = [
    AbuseCategoryType.Copyright,
    AbuseCategoryType.StolenData,
];

export const useReportAbuseModalState = ({
    nodeUid,
    drive,
    publicLinkPassword,
    publicLinkUrl,
    prefilled,
    onClose,
    onExit,
    open,
}: UseReportAbuseModalProps): ReportAbuseModalViewProps => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const [nodeData, setNodeData] = useState<
        | {
              name: string;
              size: number | undefined;
              mediaType: string | undefined;
              type: NodeType;
          }
        | undefined
    >(undefined);

    useEffect(() => {
        const fetchNodeData = async () => {
            try {
                const maybeNode = await drive.getNode(nodeUid);
                const { node } = getNodeEntity(maybeNode);
                setNodeData({
                    name: node.name,
                    size: getNodeDisplaySize(maybeNode),
                    mediaType: node.mediaType,
                    type: node.type,
                });
            } catch (e) {
                handleSdkError(e, { showNotification: true });
                onExit();
            }
        };

        void fetchNodeData();
    }, [nodeUid, drive, onExit]);

    if (!nodeData) {
        return {
            loaded: false,
        };
    }

    const handleSubmit = async (formData: { category: AbuseCategoryType; email?: string; comment?: string }) => {
        const passphrase = await drive.experimental.getNodePassphrase(nodeUid);
        try {
            await api(
                querySubmitAbuseReport({
                    ShareURL: publicLinkUrl,
                    Password: publicLinkPassword,
                    AbuseCategory: formData.category,
                    ReporterEmail: formData.email,
                    ReporterMessage: formData.comment,
                    ResourcePassphrase: passphrase,
                })
            );
            createNotification({ text: c('Info').t`Report has been sent` });
            onClose();
        } catch (e) {
            handleSdkError(e, { fallbackMessage: c('Error').t`Report failed to be sent` });
        }
    };

    return {
        loaded: true,
        handleSubmit,
        onClose,
        onExit,
        open,
        name: nodeData.name,
        size: nodeData.size,
        mediaType: nodeData.mediaType,
        type: nodeData.type,
        prefilled,
    };
};
