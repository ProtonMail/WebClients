import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useLocalState } from '@proton/components';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import {
    CHECKLIST_ITEMS_TO_COMPLETE,
    type OnboardingChecklistContext,
    useGetStartedChecklist,
} from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useMailOnboardingTelemetry } from '../../useMailOnboardingTelemetry';
import OnboardingChecklistModalsProvider from '../OnboardingChecklistModalProvider';
import useOnboardingChecklist from '../useOnboardingChecklist';
import { getOnboardingChecklistCompletionState } from './OnboardingChecklistSidebar.helpers';
import OnboardingChecklistSidebarHeader from './components/OnboardingChecklistSidebarHeader';
import OnboardingChecklistSidebarList from './components/OnboardingChecklistSidebarList';

import '../UsersOnboardingChecklist.scss';

const InfoBloc = ({ remainingDaysCount }: { remainingDaysCount: number }) => {
    const daysCount = (
        <b className="color-white" key="infobloc-content">
            {c('Get started checklist instructions').ngettext(
                msgid`${remainingDaysCount} day`,
                `${remainingDaysCount} days`,
                remainingDaysCount
            )}
        </b>
    );

    return (
        <div className="mx-3 p-3 mt-1 mb-2 text-sm bg-weak color-weak rounded">
            {c('Get started checklist instructions')
                .jt`Complete this checklist within ${daysCount} to double your storage for free.`}
        </div>
    );
};

const OnboardingChecklistSidebar = ({
    items,
    expiresAt,
    createdAt,
    changeChecklistDisplay,
    isChecklistFinished,
}: OnboardingChecklistContext) => {
    const [user] = useUser();
    const [isOpened, toggleChecklist] = useLocalState(true, `sidebar-checklist-opened-${user.ID}`);
    const [sendOnboardingTelemetry] = useMailOnboardingTelemetry();

    const { remainingDaysCount, hasReachedLimit } = getOnboardingChecklistCompletionState(createdAt, expiresAt);

    // Displays reward modal when items are completed
    useOnboardingChecklist();

    return (
        <>
            <hr className="my-4 mx-3" />
            <OnboardingChecklistSidebarHeader
                hasReachedLimit={hasReachedLimit}
                isChecklistFinished={isChecklistFinished}
                isOpened={isOpened}
                itemsCompletedCount={CHECKLIST_ITEMS_TO_COMPLETE.filter((key) => items.has(key)).length}
                itemsToCompleteCount={CHECKLIST_ITEMS_TO_COMPLETE.length}
                onCloseChecklist={() => {
                    changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN);
                    void sendOnboardingTelemetry(TelemetryMailOnboardingEvents.close_checklist, {
                        checklist_step_import_completed: items.has('Import') ? 'yes' : 'no',
                        checklist_step_mobile_app_completed: items.has('MobileApp') ? 'yes' : 'no',
                        checklist_step_privacy_completed: items.has('ProtectInbox') ? 'yes' : 'no',
                        checklist_step_update_login_completed: items.has('AccountLogin') ? 'yes' : 'no',
                    });
                }}
                onToggleChecklist={toggleChecklist}
                remainingDaysCount={remainingDaysCount}
            />
            {isOpened && (
                <>
                    {!(isChecklistFinished || hasReachedLimit) && <InfoBloc remainingDaysCount={remainingDaysCount} />}
                    <div data-testid="onboarding-checklist" className="px-3 w-full flex flex-column shrink-0">
                        <OnboardingChecklistSidebarList />
                    </div>
                </>
            )}
        </>
    );
};

const OnboardingChecklistSidebarWrapper = () => {
    const checklistContext = useGetStartedChecklist();

    if (
        checklistContext.displayState === CHECKLIST_DISPLAY_TYPE.HIDDEN ||
        // To prevent old users from seeing the checklist again
        checklistContext.createdAt < new Date('2024-10-20')
    ) {
        return null;
    }

    return (
        <OnboardingChecklistModalsProvider>
            <OnboardingChecklistSidebar {...checklistContext} />
        </OnboardingChecklistModalsProvider>
    );
};

export default OnboardingChecklistSidebarWrapper;
