import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import LabelsUpsellModal from '@proton/components/components/upsell/modal/types/LabelsUpsellModal';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { orderAllFolders } from '@proton/shared/lib/api/labels';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';

import { useApi, useEventManager, useFolders, useNotifications, useUser } from '../../hooks';
import FolderTreeViewList from './FolderTreeViewList';
import ToggleEnableFolderColor from './ToggleEnableFolderColor';
import ToggleInheritParentFolderColor from './ToggleInheritParentFolderColor';
import EditLabelModal from './modals/EditLabelModal';

function ScrollWrapper({ children, scroll }: { children: JSX.Element; scroll?: boolean }) {
    return scroll ? (
        <Scroll className="overflow-hidden pb-2 h-custom" style={{ '--h-custom': '50rem' }}>
            {children}
        </Scroll>
    ) : (
        children
    );
}

export default function FoldersSection() {
    const [user] = useUser();
    const [folders = [], loadingFolders] = useFolders();
    const [mailSettings] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();
    const canCreateFolder = !hasReachedFolderLimit(user, folders);
    const [editLabelModalProps, setEditLabelModalOpen, renderEditLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleSortAllFolders = async () => {
        await api(orderAllFolders());
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
                        <SettingsLayoutRight isToggleContainer>
                            <ToggleEnableFolderColor id="folder-colors" />
                        </SettingsLayoutRight>
                    </SettingsLayout>

                    {mailSettings?.EnableFolderColor ? (
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label htmlFor="parent-folder-color" className="text-semibold">
                                    <span className="mr-1">{c('Label').t`Inherit color from parent folder`}</span>
                                    <Info
                                        title={c('Info - folder colouring feature')
                                            .t`When enabled, sub-folders inherit the color of the parent folder.`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight isToggleContainer>
                                <ToggleInheritParentFolderColor id="parent-folder-color" />
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    ) : null}

                    <div className="flex gap-4 my-7 folders-action">
                        {canCreateFolder ? (
                            <Button color="norm" onClick={() => setEditLabelModalOpen(true)}>
                                {c('Action').t`Add folder`}
                            </Button>
                        ) : (
                            <MailUpsellButton
                                onClick={() => handleUpsellModalDisplay(true)}
                                text={c('Action').t`Get more folders`}
                            />
                        )}
                        {folders.length ? (
                            <Button
                                shape="outline"
                                title={c('Title').t`Sort folders alphabetically`}
                                loading={loading}
                                onClick={() => withLoading(handleSortAllFolders())}
                            >
                                {c('Action').t`Sort`}
                            </Button>
                        ) : null}
                    </div>

                    {folders.length ? (
                        // 17 is the number of elements before we have more than 50rem, will be replaced soon by a fix in scroll component
                        <ScrollWrapper scroll={folders.length > 17}>
                            <FolderTreeViewList items={folders} />
                        </ScrollWrapper>
                    ) : null}

                    {renderEditLabelModal && <EditLabelModal {...editLabelModalProps} type="folder" />}

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
