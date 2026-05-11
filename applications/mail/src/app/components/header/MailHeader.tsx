import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';

import FloatingButton from '@proton/components/components/button/FloatingButton';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcPen } from '@proton/icons/icons/IcPen';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { selectHasFocusedComposer } from 'proton-mail/store/composers/composerSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useOnCompose } from '../../containers/ComposeProvider';
import { getLabelName } from '../../helpers/labels';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../store/layout/layoutSliceSelectors';
import { MailHeaderActionArea } from './MailHeaderActionArea';

interface Props {
    labelID: string;
    elementID: string | undefined;
    selectedIDs: string[];
    toolbar?: ReactNode | undefined;
    settingsButton?: ReactNode;
}

const MailHeader = ({ labelID, elementID, selectedIDs = [], toolbar, settingsButton }: Props) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
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

    const hasComposerInFocus = useMailSelector(selectHasFocusedComposer);
    const shouldDragInElectronMailClassName = hasComposerInFocus && isElectronMail ? 'ignore-drag' : '';

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONMAIL}
                className={shouldDragInElectronMailClassName}
                userDropdown={<UserDropdown app={APPS.PROTONMAIL} />}
                hideMenuButton={hideMenuButton}
                hideUpsellButton={hideUpsellButton}
                title={labelName}
                actionArea={<MailHeaderActionArea toolbar={toolbar} />}
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
