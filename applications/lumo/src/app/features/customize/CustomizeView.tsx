import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { SkillEditorModal } from '../skills/components/SkillEditorModal';
import { SkillLimitModal } from '../skills/components/SkillLimitModal';
import { useSkillLimit } from '../skills/useSkillLimit';
import { CustomizeConnectorsTab } from './components/CustomizeConnectorsTab';
import { CustomizeGuestView } from './components/CustomizeGuestView';
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
    const isGuest = useIsGuest();
    const [searchQuery, setSearchQuery] = useState('');
    const createModal = useModalStateObject();
    const { checkCanAddSkills, skillLimitModal, skillLimitModalState } = useSkillLimit();

    const params = new URLSearchParams(location.search);
    const activeTab = parseCustomizeTab(params.get('tab'));
    const skillsView = parseSkillsView(params.get('view'));

    useEffect(() => {
        setSearchQuery('');
    }, [activeTab, skillsView]);

    const navigate = (tab: CustomizeTab, view?: SkillsView) => {
        history.replace({ pathname: '/customize', search: getCustomizeSearch(tab, view) });
    };

    if (isGuest) {
        return (
            <LumoLayoutWithDrawer drawer={{ disabled: true }}>
                <CustomizePage>
                    <CustomizeGuestView />
                </CustomizePage>
            </LumoLayoutWithDrawer>
        );
    }

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
                    onCreateSkill={() => {
                        if (checkCanAddSkills()) createModal.openModal(true);
                    }}
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
            {skillLimitModal.render && <SkillLimitModal {...skillLimitModal.modalProps} {...skillLimitModalState} />}
            {createModal.render && (
                <SkillEditorModal
                    {...createModal.modalProps}
                    onSaved={(skill) => history.push(getSkillPath(skill.id))}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
