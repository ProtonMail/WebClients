import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';

import FloatingButton from '@proton/components/components/button/FloatingButton';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { Hamburger } from '@proton/components/index';
import { IcPen } from '@proton/icons/icons/IcPen';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import type { ElementsStructure } from '../../hooks/mailbox/useElements';
import type { MailboxActions } from '../../router/interface';
import { selectHasFocusedComposer } from '../../store/composers/composerSelectors';
import { selectElementID } from '../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../store/hooks';

import { useOnCompose } from '../../containers/ComposeProvider';
import { getLabelName } from '../../helpers/labels';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../store/layout/layoutSliceSelectors';
import { useCategoriesOnboarding } from '../categoryView/categoriesOnboarding/CategoriesOnboardingContext';
import { CategoriesOnboardingSpotlight } from '../categoryView/categoriesOnboarding/CategoriesOnboardingSpotlights';
import { OnboardingStep } from '../categoryView/categoriesOnboarding/onboardingInterface';
import { MailHeaderActionArea } from './MailHeaderActionArea';

interface Props {
    labelID: string;
    elementsData: ElementsStructure;
    actions: MailboxActions;
    settingsButton?: ReactNode;
    toolbar?: ReactNode | undefined;
}

const MailHeader = ({ labelID, elementsData, actions, toolbar, settingsButton }: Props) => {
    const elementID = useMailSelector(selectElementID);

    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const dispatch = useMailDispatch();
    const expanded = useMailSelector(selectLayoutIsExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A7EB47
    const onToggleExpand = useCallback(() => dispatch(layoutActions.toggleSidebarExpand()), []);

    const breakpoints = useActiveBreakpoint();

    const onCompose = useOnCompose();

    const { userIsInB2COnboardingFlow } = useCategoriesOnboarding();

    const isSmallViewport = breakpoints.viewportWidth['<=small'];
    const hideMenuButton = isSmallViewport && !!elementID;
    const hideUpsellButton =
        (isSmallViewport || breakpoints.viewportWidth.medium) && (!!elementID || actions.selectedIDs.length !== 0);
    const labelName = getLabelName(labelID, labels, folders);

    const hasComposerInFocus = useMailSelector(selectHasFocusedComposer);
    const shouldDragInElectronMailClassName = hasComposerInFocus && isElectronMail ? 'ignore-drag' : '';

    // We override the hamburger menu for small viewports during category onboarding to show the last feature tour step.
    const customMenuButton =
        userIsInB2COnboardingFlow && isSmallViewport ? (
            <CategoriesOnboardingSpotlight step={OnboardingStep.CUSTOMIZE}>
                <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            </CategoriesOnboardingSpotlight>
        ) : undefined;

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONMAIL}
                className={shouldDragInElectronMailClassName}
                userDropdown={<UserDropdown app={APPS.PROTONMAIL} />}
                hideMenuButton={hideMenuButton}
                overrideMenuButton={customMenuButton}
                hideUpsellButton={hideUpsellButton}
                title={labelName}
                actionArea={<MailHeaderActionArea toolbar={toolbar} actions={actions} elementsData={elementsData} />}
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
