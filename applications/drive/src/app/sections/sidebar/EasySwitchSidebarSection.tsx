import { c } from 'ttag';

import { useProductSelectionSubmit } from '@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { SidebarListItem, SidebarListItemContent, navigationIconClassName } from '@proton/components';
import NewFeatureTag from '@proton/components/components/newFeatureTag/NewFeatureTag';
import googleDriveLogo from '@proton/styles/assets/img/import/providers/google-drive.svg';
import clsx from '@proton/utils/clsx';

interface EasySwitchSidebarSectionProps {
    collapsed: boolean;
}

export const EasySwitchSidebarSection = ({ collapsed }: EasySwitchSidebarSectionProps) => {
    const { handleSubmit } = useProductSelectionSubmit();

    return (
        <>
            <SidebarListItem className="mt-4">
                <span className={clsx('text-sm color-weak text-semibold pl-3', collapsed && 'sr-only')}>
                    {c('Title').t`Easy switch`}
                </span>
            </SidebarListItem>
            <SidebarListItem>
                <button
                    type="button"
                    className="navigation-link w-full text-left"
                    aria-label={c('Action').t`Import from Google`}
                    onClick={() => {
                        handleSubmit(ImportProvider.GOOGLE, [ImportType.DRIVE], EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR);
                    }}
                >
                    <SidebarListItemContent
                        className={clsx('flex flex-nowrap', collapsed && 'justify-center')}
                        collapsed={collapsed}
                        left={
                            <img
                                src={googleDriveLogo}
                                alt="Google Drive"
                                className={clsx(navigationIconClassName, 'w-4')}
                            />
                        }
                        right={!collapsed ? <NewFeatureTag featureKey="drive-easy-switch-sidebar" /> : undefined}
                    >
                        <span className="text-ellipsis">{c('Action').t`Import from Google`}</span>
                    </SidebarListItemContent>
                </button>
            </SidebarListItem>
        </>
    );
};
