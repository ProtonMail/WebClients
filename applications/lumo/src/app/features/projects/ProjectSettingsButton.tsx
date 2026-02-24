/* eslint-disable no-nested-ternary */
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';

interface ProjectDetailViewHeaderProps {
    onClick: () => void;
    showSidebar: boolean;
    isMobileView: boolean;
}
const ProjectSettingsButton = ({ onClick, showSidebar, isMobileView }: ProjectDetailViewHeaderProps) => {
    return (
        <Button
            shape="ghost"
            onClick={onClick}
            title={
                isMobileView
                    ? c('collider_2025:Action').t`Show instructions and files`
                    : showSidebar
                      ? c('collider_2025:Action').t`Hide sidebar`
                      : c('collider_2025:Action').t`Show sidebar`
            }
            className="project-detail-settings-button flex items-center color-weak flex-nowrap"
        >
            <Icon
                name={isMobileView ? 'meet-settings' : showSidebar ? 'arrow-right' : 'meet-settings'}
                className="mr-1"
            />
            <span>
                {isMobileView
                    ? c('collider_2025:Action').t`Settings`
                    : showSidebar
                      ? c('collider_2025:Action').t`Hide settings`
                      : c('collider_2025:Action').t`Show settings`}
            </span>
        </Button>
    );
};

export default ProjectSettingsButton;
