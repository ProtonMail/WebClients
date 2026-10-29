import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { SkillEditorModal } from '../skills/components/SkillEditorModal';
import { CustomizeConnectorsTab } from './components/CustomizeConnectorsTab';
import { CustomizePage } from './components/CustomizePage';
import { CustomizePageHeader } from './components/CustomizePageHeader';
import { CustomizeSkillsTab } from './components/CustomizeSkillsTab';
import {
    type CustomizeTab,
    type SkillsView,
    getCustomizeSearch,
    parseCustomizeTab,
    parseSkillsView,
} from './customizeTabs';
import { getSkillPath } from './skillRoutes';

import './CustomizeView.scss';

export const CustomizeView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });

    const history = useHistory();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const createModal = useModalStateObject();

    const params = new URLSearchParams(location.search);
    const activeTab = parseCustomizeTab(params.get('tab'));
    const skillsView = parseSkillsView(params.get('view'));

    useEffect(() => {
        setSearchQuery('');
    }, [activeTab, skillsView]);

    const navigate = (tab: CustomizeTab, view?: SkillsView) => {
        history.replace({ pathname: '/customize', search: getCustomizeSearch(tab, view) });
    };

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <CustomizePage>
                <CustomizePageHeader
                    activeTab={activeTab}
                    onTabChange={(tab) => navigate(tab)}
                    skillsView={skillsView}
                    onSkillsViewChange={(view) => navigate('skills', view)}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onCreateSkill={() => createModal.openModal(true)}
                    onUploadSkill={() => history.push('/customize/upload')}
                />
                {activeTab === 'skills' ? (
                    <CustomizeSkillsTab
                        view={skillsView}
                        searchQuery={searchQuery}
                        onBrowse={() => navigate('skills', 'discover')}
                    />
                ) : (
                    <CustomizeConnectorsTab searchQuery={searchQuery} />
                )}
            </CustomizePage>
            {createModal.render && (
                <SkillEditorModal
                    {...createModal.modalProps}
                    onSaved={(skill) => history.push(getSkillPath(skill.id))}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
