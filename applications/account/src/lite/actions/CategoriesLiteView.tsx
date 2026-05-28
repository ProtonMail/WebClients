import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { CategoriesHeader } from '../components/CategoryView/CategoriesHeader';
import { CategoriesSettings } from '../components/CategoryView/CategoriesSettings';
import { CategoriesToggle } from '../components/CategoryView/CategoriesToggle';

import './MobileSettings.scss';

interface CategoryViewProps {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    loader: React.ReactNode;
}

export const CategoriesLiteView = ({ layout, loader }: CategoryViewProps) => {
    // Preaload needed data for children
    const [, mailSettingsLoading] = useMailSettings();
    const [, foldersLoading] = useFolders();

    const loading = !!(mailSettingsLoading || foldersLoading);

    if (loading) {
        return loader;
    }

    return layout(
        <div className="mobile-settings">
            <CategoriesHeader />
            <CategoriesToggle />
            <CategoriesSettings />
        </div>,
        { className: 'overflow-auto' }
    );
};
