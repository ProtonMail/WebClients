import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { FloatingButton, PrivateHeader, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { IcPen } from '@proton/icons/icons/IcPen';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { selectHasFocusedComposer } from 'proton-mail/store/composers/composerSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

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
    toolbar?: ReactNode | undefined;
    settingsButton?: ReactNode;
}

const MailHeader = ({ labelID, elementID, selectedIDs = [], toolbar, settingsButton }: Props) => {
    const location = useLocation();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [mailSettings] = useMailSettings();
    const dispatch = useMailDispatch();
    const expanded = useMailSelector(selectLayoutIsExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A7EB47
    const onToggleExpand = useCallback(() => dispatch(layoutActions.toggleSidebarExpand()), []);

    const breakpoints = useActiveBreakpoint();

    const onCompose = useOnCompose();

    const hideMenuButton = breakpoints.viewportWidth['<=small'] && !!elementID;
    const hideUpsellButton =
        (breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium) &&
        (!!elementID || selectedIDs.length !== 0);
    const labelName = getLabelName(labelID, labels, folders);

    const isColumn = isColumnMode(mailSettings);

    const hasComposerInFocus = useMailSelector(selectHasFocusedComposer);
    const shouldDragInElectronMailClassName = hasComposerInFocus && isElectronMail ? 'ignore-drag' : '';

    /** Search is displayed everytime except when we are on message view with row mode */
    const displaySearch = !(!isColumn && elementID);

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONMAIL}
                className={shouldDragInElectronMailClassName}
                userDropdown={<UserDropdown app={APPS.PROTONMAIL} />}
                hideMenuButton={hideMenuButton}
                hideUpsellButton={hideUpsellButton}
                title={labelName}
                actionArea={
                    breakpoints.viewportWidth['<=small'] ||
                    breakpoints.viewportWidth.medium ||
                    (breakpoints.viewportWidth.large && elementID) ? (
                        <div className="flex-1 flex flex-nowrap justify-space-between">
                            {toolbar}
                            {!elementID && <MailSearch labelID={labelID} location={location} columnMode={isColumn} />}
                        </div>
                    ) : displaySearch ? (
                        <MailSearch labelID={labelID} location={location} columnMode={isColumn} />
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
                        <IcPen size={6} className="m-auto" />
                    </FloatingButton>
                }
            />
        </>
    );
};

export default memo(MailHeader);
