import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import {
    AbuseCategory,
    type NodeType,
    type ProtonDriveClient,
    type ProtonDrivePhotosClient,
    type ProtonDrivePublicLinkClient,
} from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeName } from '../preview/nodeUtils';
import type { ReportAbuseModalViewProps } from './ReportAbuseModalView';
import type { AbuseReportPrefill } from './types';

type Drive = {
    getNode: ProtonDrivePublicLinkClient['getNode'] | ProtonDriveClient['getNode'] | ProtonDrivePhotosClient['getNode'];
    reportAbuse:
        | ProtonDrivePublicLinkClient['reportAbuse']
        | ProtonDriveClient['reportAbuse']
        | ProtonDrivePhotosClient['reportAbuse'];
};

export type UseReportAbuseModalProps = ModalStateProps & {
    drive: Drive;
    nodeUid: string;
    revisionUid?: string;
    prefilled?: AbuseReportPrefill;
};

export const ABUSE_CATEGORIES = [
    {
        type: AbuseCategory.Spam,
        getText: () => c('Label').t`Spam`,
    },
    {
        type: AbuseCategory.Copyright,
        getText: () => c('Label').t`Copyright infringement`,
    },
    {
        type: AbuseCategory.ChildAbuse,
        getText: () => c('Label').t`Child sexual abuse material`,
    },
    {
        type: AbuseCategory.NonConsensualIntimate,
        getText: () => c('Label').t`Non-consensual intimate imagery`,
    },
    {
        type: AbuseCategory.StolenData,
        getText: () => c('Label').t`Stolen data`,
    },
    {
        type: AbuseCategory.Malware,
        getText: () => c('Label').t`Malware`,
    },
    {
        type: AbuseCategory.Other,
        getText: () => c('Label').t`Other`,
    },
];

export const CATEGORIES_WITH_EMAIL_VERIFICATION: AbuseCategory[] = [AbuseCategory.Copyright, AbuseCategory.StolenData];

export const useReportAbuseModalState = ({
    nodeUid,
    revisionUid,
    drive,
    prefilled,
    onClose,
    onExit,
    open,
}: UseReportAbuseModalProps): ReportAbuseModalViewProps => {
    const { createNotification } = useNotifications();
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
                const node = await drive.getNode(nodeUid);
                setNodeData({
                    name: getNodeName(node),
                    size: getNodeDisplaySize(node),
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

    const handleSubmit = async (formData: { category: AbuseCategory; email?: string; comment?: string }) => {
        try {
            await drive.reportAbuse({
                abuseCategory: formData.category,
                reporterEmail: formData.email,
                reporterMessage: formData.comment,
                nodeUid,
                revisionUid,
                bonaFide: true,
            });
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
