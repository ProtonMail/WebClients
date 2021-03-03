import React from 'react';
import { useFolders, Tooltip, useMailSettings, classnames } from 'react-components';

import { getCurrentFolders } from '../../helpers/labels';
import { Element } from '../../models/element';
import ItemIcon from './ItemIcon';

interface Props {
    element: Element | undefined;
    labelID: string;
    shouldStack?: boolean;
    showTooltip?: boolean;
    withDefaultMargin?: boolean;
}

const ItemLocation = ({
    element,
    labelID,
    shouldStack = false,
    showTooltip = true,
    withDefaultMargin = true,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [customFolders = []] = useFolders();
    let infos = getCurrentFolders(element, labelID, customFolders, mailSettings);

    if (infos.length > 1 && shouldStack) {
        infos = [
            {
                to: infos.map((info) => info.to).join(','),
                name: infos.map((info) => info.name).join(', '),
                icon: 'parent-folder',
            },
        ];
    }

    return (
        <>
            {infos.map((folderInfo) => (
                <Tooltip
                    className={classnames([withDefaultMargin && 'mr0-25'])}
                    title={showTooltip ? folderInfo.name : undefined}
                    key={folderInfo.to}
                >
                    <span className="flex flex-item-noshrink pt0-125">
                        <ItemIcon folderInfo={folderInfo} />
                    </span>
                </Tooltip>
            ))}
        </>
    );
};

export default ItemLocation;
