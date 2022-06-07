import { useFolders, Tooltip, useMailSettings, classnames } from '@proton/components';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getCurrentFolders } from '../../helpers/labels';
import { Element } from '../../models/element';
import ItemIcon from './ItemIcon';
import { getLabelIDsToI18N } from '../../constants';

const { ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

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
        const labelsWithoutIcons: string[] = [ALL_SENT, ALL_DRAFTS];
        if (labelsWithoutIcons.includes(labelID)) {
            const labelsWithoutIconsToI18N = [getLabelIDsToI18N()[ALL_SENT], getLabelIDsToI18N()[ALL_DRAFTS]];
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
                    <span className={classnames(['flex flex-item-noshrink pt0-125', withDefaultMargin && 'mr0-25'])}>
                        <ItemIcon folderInfo={folderInfo} />
                    </span>
                </Tooltip>
            ))}
        </>
    );
};

export default ItemLocation;
