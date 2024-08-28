import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import type { Breakpoints } from '@proton/components';
import { FloatingButton, Icon, PrivateHeader, UserDropdown, useFolders, useLabels } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { getLabelName } from '../../helpers/labels';
import { isColumnMode } from '../../helpers/mailSettings';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../store/layout/layoutSliceSelectors';
import MailSearch from './search/MailSearch';

interface Props {
    labelID: string;
    elementID: string | undefined;
    selectedIDs: string[];
    breakpoints: Breakpoints;
    toolbar?: ReactNode | undefined;
    settingsButton?: ReactNode;
}

const MailHeader = ({ labelID, elementID, selectedIDs = [], breakpoints, toolbar, settingsButton }: Props) => {
    const location = useLocation();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useMailDispatch();
    const expanded = useMailSelector(selectLayoutIsExpanded);
    const onToggleExpand = useCallback(() => dispatch(layoutActions.toggleSidebarExpand()), []);

    const onCompose = useOnCompose();

    const hideMenuButton = breakpoints.viewportWidth['<=small'] && !!elementID;
    const hideUpsellButton =
        (breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium) &&
        (!!elementID || selectedIDs.length !== 0);
    const labelName = getLabelName(labelID, labels, folders);

    const isColumn = isColumnMode(mailSettings);

    /** Search is displayed everytime except when we are on message view with row mode */
    const displaySearch = !(!isColumn && elementID);

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONMAIL}
                userDropdown={<UserDropdown app={APPS.PROTONMAIL} />}
                hideMenuButton={hideMenuButton}
                hideUpsellButton={hideUpsellButton}
                title={labelName}
                actionArea={
                    breakpoints.viewportWidth['<=small'] ||
                    breakpoints.viewportWidth.medium ||
                    (breakpoints.viewportWidth.large && elementID) ? (
                        <div className="flex flex-nowrap justify-space-between">
                            {toolbar}
                            {!elementID && (
                                <MailSearch
                                    breakpoints={breakpoints}
                                    labelID={labelID}
                                    location={location}
                                    columnMode={isColumn}
                                />
                            )}
                        </div>
                    ) : displaySearch ? (
                        <MailSearch
                            breakpoints={breakpoints}
                            labelID={labelID}
                            location={location}
                            columnMode={isColumn}
                        />
                    ) : (
                        <>{toolbar}</>
                    )
                }
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                isSmallViewport={breakpoints.viewportWidth['<=small']}
                settingsButton={settingsButton}
                floatingButton={
                    <FloatingButton
                        data-testid="compose-floating-button"
                        onClick={() => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW })}
                    >
                        <Icon size={6} name="pen" className="m-auto" />
                    </FloatingButton>
                }
            />
        </>
    );
};

export default memo(MailHeader);
