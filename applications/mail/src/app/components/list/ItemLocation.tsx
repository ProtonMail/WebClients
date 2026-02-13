import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { getCurrentFolders, getStandardFolders } from '../../helpers/labels';
import type { Element } from '../../models/element';
import ItemIcon from './ItemIcon';

interface Props {
    element: Element | undefined;
    labelID: string;
    shouldStack?: boolean;
    showTooltip?: boolean;
    withDefaultMargin?: boolean;
    ignoreIconFilter?: boolean;
}

const ItemLocation = ({
    element,
    labelID,
    shouldStack = false,
    showTooltip = true,
    withDefaultMargin = true,
    ignoreIconFilter = false,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [customFolders = []] = useFolders();
    let infos = getCurrentFolders(element, labelID, customFolders, mailSettings);

    // At some places, we want to display all icons except the current location for some folders (all sent and all drafts)
    if (!ignoreIconFilter) {
        const labelsWithoutIcons: string[] = [MAILBOX_LABEL_IDS.ALL_SENT, MAILBOX_LABEL_IDS.ALL_DRAFTS];
        if (labelsWithoutIcons.includes(labelID)) {
            const STANDARD_FOLDERS = getStandardFolders();
            const labelsWithoutIconsToI18N = [
                STANDARD_FOLDERS[MAILBOX_LABEL_IDS.ALL_SENT].name,
                STANDARD_FOLDERS[MAILBOX_LABEL_IDS.ALL_DRAFTS].name,
            ];
            infos = infos.filter((info) => !labelsWithoutIconsToI18N.includes(info.name));
        }
    }

    if (infos.length > 1 && shouldStack) {
        infos = [
            {
                to: infos.map((info) => info.to).join(','),
                name: infos.map((info) => info.name).join(', '),
                icon: 'folders',
            },
        ];
    }

    return (
        <>
            {infos.map((folderInfo) => (
                <Tooltip title={showTooltip ? folderInfo.name : undefined} key={folderInfo.to}>
                    <span
                        className={clsx(['flex shrink-0 py-0.5', withDefaultMargin && 'mr-1'])}
                        data-testid={`item-location-${folderInfo.name}`}
                    >
                        <ItemIcon folderInfo={folderInfo} />
                    </span>
                </Tooltip>
            ))}
        </>
    );
};

export default ItemLocation;
