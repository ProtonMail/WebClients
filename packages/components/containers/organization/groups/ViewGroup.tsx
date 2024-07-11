import { c, msgid } from 'ttag';

import { Panel, PanelHeader } from '@proton/atoms/Panel';
import { Copy } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { Group } from '@proton/shared/lib/interfaces';

import { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData: Group;
}

const ViewGroup = ({ groupsManagement: { selectedGroup }, groupData }: Props) => {
    const { createNotification } = useNotifications();

    const handleCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    const memberCount = groupData.MemberCount ?? 0;

    if (!selectedGroup) {
        return null;
    }

    return (
        <Panel
            header={
                <PanelHeader
                    title=""
                    subtitle=""
                    actions={(() => {
                        return [];
                    })()}
                />
            }
        >
            <div className="flex-col text-left">
                {groupData.Name && (
                    <div className="mb-6">
                        <h3 className="text-bold">{groupData.Name}</h3>
                        {groupData.Description !== '' && groupData.Description}
                    </div>
                )}
                {groupData.Address.Email && (
                    <div className="mb-4">
                        <div className="color-weak text-sm">{c('Group address title').t`Group address`}</div>
                        <div className="text-left">
                            <span className="flex-1 my-auto mr-2">{groupData.Address.Email}</span>
                            <Copy
                                size="small"
                                shape="ghost"
                                value={groupData.Address.Email}
                                className="shrink-0 expand-click-area"
                                onCopy={handleCopy}
                            />
                        </div>
                    </div>
                )}
                <div className="gap-2">
                    <p className="color-weak text-sm p-0">
                        {c('Group member count').ngettext(
                            msgid`${memberCount} member`,
                            `${memberCount} members`,
                            memberCount
                        )}
                    </p>
                </div>
            </div>
        </Panel>
    );
};

export default ViewGroup;
