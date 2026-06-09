import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import clsx from '@proton/utils/clsx';

import EditGroupModal from '../EditGroupModal';
import GroupEmptyView from '../GroupEmptyView';
import GroupList from '../GroupList';
import ViewGroup from '../ViewGroup';
import { useGroupsManagement } from '../context/GroupsManagementContext';
import { GROUPS_STATE } from '../types';

import './GroupsMemberManagementPanel.scss';

// Must match the `transition: transform 0.6s` duration in GroupsMemberManagementPanel.scss
const SLIDE_OUT_MS = 600;

const FormContainer = ({ children }: { children: React.ReactNode }) => {
    const { selectedGroup, actions } = useGroupsManagement();
    const breakpoints = useActiveBreakpoint();
    const [isVisible, setIsVisible] = useState(!!selectedGroup);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        setIsVisible(!!selectedGroup);
    }, [selectedGroup]);

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    if (breakpoints.viewportWidth['>=large']) {
        return <div className="bg-norm border-left border-norm grow-2 shrink-0">{children}</div>;
    }

    const handleBack = () => {
        setIsVisible(false);
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SLIDE_OUT_MS;
        timerRef.current = setTimeout(() => actions.onUnselectGroup(), duration);
    };

    return (
        <div className={clsx('groups-member-panel-overlay shadow-lifted', isVisible && 'is-visible')}>
            <div className="flex items-center border-bottom border-weak py-2 shrink-0">
                <Button
                    className="flex items-center justify-start gap-2 ml-4"
                    shape="ghost"
                    size="small"
                    onClick={handleBack}
                >
                    <IcArrowLeft />
                    {c('Action').t`Back`}
                </Button>
            </div>
            <div className="pr-4 overflow-y-auto flex-1">{children}</div>
        </div>
    );
};

const GroupsMemberManagementPanel = () => {
    const { uiState, selectedGroup } = useGroupsManagement();
    const editing = uiState === GROUPS_STATE.NEW || (uiState === GROUPS_STATE.EDIT && selectedGroup);

    return (
        <div className="content flex-1 mt-8 flex flex-nowrap gap-6">
            <div className="groups-member-panel-list relative flex flex-column flex-nowrap justify-start items-stretch shrink-0 w-full lg:w-custom">
                <GroupList />
            </div>
            <FormContainer>{selectedGroup ? <ViewGroup /> : <GroupEmptyView />}</FormContainer>
            {editing && <EditGroupModal />}
        </div>
    );
};

export default GroupsMemberManagementPanel;
