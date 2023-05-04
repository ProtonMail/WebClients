import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { orderFolders } from '@proton/shared/lib/api/labels';
import { MAIL_UPSELL_PATHS, ROOT_FOLDER } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';

import { Icon, Info, LabelsUpsellModal, Loader, useModalState } from '../../components';
import {
    useApi,
    useEventManager,
    useFolders,
    useLoading,
    useMailSettings,
    useNotifications,
    useUser,
} from '../../hooks';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import FolderTreeViewList from './FolderTreeViewList';
import ToggleEnableFolderColor from './ToggleEnableFolderColor';
import ToggleInheritParentFolderColor from './ToggleInheritParentFolderColor';
import EditLabelModal from './modals/EditLabelModal';

function LabelsSection() {
    const [user] = useUser();
    const [folders = [], loadingFolders] = useFolders();
    const [mailSettings] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();

    const canCreateFolder = !hasReachedFolderLimit(user, folders);

    const [editLabelProps, setEditLabelModalOpen] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleSortFolders = async () => {
        const rootFolders = folders.filter(({ ParentID = ROOT_FOLDER }) => ParentID === ROOT_FOLDER);

        const LabelIDs = [...rootFolders]
            .sort((a, b) => a.Name.localeCompare(b.Name, undefined, { numeric: true }))
            .map(({ ID }) => ID);
        await api(orderFolders({ LabelIDs }));
        await call();
        createNotification({ text: c('Success message after sorting folders').t`Folders sorted` });
    };

    return (
        <SettingsSection>
            {loadingFolders ? (
                <Loader />
            ) : (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="folder-colors" className="text-semibold">
                                {c('Label').t`Use folder colors`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt0-5">
                            <ToggleEnableFolderColor id="folder-colors" />
                        </SettingsLayoutRight>
                    </SettingsLayout>

                    {mailSettings?.EnableFolderColor ? (
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label
                                    htmlFor="parent-folder-color"
                                    className="text-semibold flex flex-align-items-center gap-2"
                                >
                                    <span>{c('Label').t`Inherit color from parent folder`}</span>
                                    <Info
                                        title={c('Info - folder colouring feature')
                                            .t`When enabled, sub-folders inherit the color of the parent folder.`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight className="pt0-5">
                                <ToggleInheritParentFolderColor id="parent-folder-color" />
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    ) : null}

                    <div className="my-7">
                        {canCreateFolder ? (
                            <Button color="norm" onClick={() => setEditLabelModalOpen(true)}>
                                {c('Action').t`Add folder`}
                            </Button>
                        ) : (
                            <Button
                                shape="outline"
                                onClick={() => handleUpsellModalDisplay(true)}
                                className="mb-2 md:mb-0 inline-flex flex-nowrap flex-align-items-baseline"
                            >
                                <Icon name="brand-proton-mail-filled" className="flex-item-noshrink my-auto" />
                                <span className="flex-item-noshrink mr-2" aria-hidden="true">
                                    +
                                </span>
                                {c('Action').t`Get more folders`}
                            </Button>
                        )}
                        {folders.length ? (
                            <Button
                                className="ml-4"
                                shape="outline"
                                title={c('Title').t`Sort folders alphabetically`}
                                loading={loading}
                                onClick={() => withLoading(handleSortFolders())}
                            >
                                {c('Action').t`Sort`}
                            </Button>
                        ) : null}
                    </div>

                    {folders.length ? <FolderTreeViewList items={folders} /> : null}

                    <EditLabelModal {...editLabelProps} type="folder" />

                    {renderUpsellModal && (
                        <LabelsUpsellModal
                            modalProps={upsellModalProps}
                            feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS}
                            isSettings
                        />
                    )}
                </>
            )}
        </SettingsSection>
    );
}

export default LabelsSection;
