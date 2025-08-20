import { differenceInDays } from 'date-fns';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useLocalState } from '@proton/components';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useMailOnboardingTelemetry } from '../../useMailOnboardingTelemetry';
import OnboardingChecklistModalsProvider from '../OnboardingChecklistModalsProvider';
import useOnboardingChecklist from '../useOnboardingChecklist';
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

const OnboardingChecklistSidebar = () => {
    // This hooks manages reward modal display when items are completed
    useOnboardingChecklist();

    const [user] = useUser();
    const [isOpened, toggleChecklist] = useLocalState(true, `sidebar-checklist-opened-${user.ID}`);
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();
    const { items, changeChecklistDisplay, isChecklistFinished, isUserPaid, expiresAt, createdAt } =
        useGetStartedChecklist();

    // If no expiration date, we consider the checklist as expired
    const hasExpired = expiresAt ? expiresAt < new Date() : true;
    const daysBeforeExpire = hasExpired || !expiresAt ? 0 : differenceInDays(expiresAt, createdAt);
    /**
     * The checklist can be closed if:
     * - The user has completed all the items
     * - The user has the paid checklist (user first registered with a paid plan)
     * - The checklist has expired
     */
    const canCloseChecklist = isChecklistFinished || isUserPaid || hasExpired;
    // The countdown is displayed if the checklist is not closed and the user has no paid plan
    const canDisplayCountDown = !canCloseChecklist && !user.isPaid;

    return (
        <>
            <hr className="my-4 mx-3" />
            <OnboardingChecklistSidebarHeader
                canCloseChecklist={canCloseChecklist}
                canDisplayCountDown={canDisplayCountDown}
                isOpened={isOpened}
                onCloseChecklist={() => {
                    changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN);
                    void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.close_checklist, {
                        checklist_step_import_completed: items.has('Import') ? 'yes' : 'no',
                        checklist_step_mobile_app_completed: items.has('MobileApp') ? 'yes' : 'no',
                        checklist_step_privacy_completed: items.has('ProtectInbox') ? 'yes' : 'no',
                        checklist_step_update_login_completed: items.has('AccountLogin') ? 'yes' : 'no',
                    });
                }}
                onToggleChecklist={toggleChecklist}
                remainingDaysCount={daysBeforeExpire}
            />
            {isOpened && (
                <>
                    {canDisplayCountDown && <InfoBloc remainingDaysCount={daysBeforeExpire} />}
                    <div data-testid="onboarding-checklist" className="px-3 w-full flex flex-column shrink-0">
                        <OnboardingChecklistSidebarList />
                    </div>
                </>
            )}
        </>
    );
};

const OnboardingChecklistSidebarWrapper = () => (
    <OnboardingChecklistModalsProvider>
        <OnboardingChecklistSidebar />
    </OnboardingChecklistModalsProvider>
);

export default OnboardingChecklistSidebarWrapper;
