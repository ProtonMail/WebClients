import { useEffect, useMemo, useState } from 'react';

import { differenceInDays } from 'date-fns';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    ErrorBoundary,
    FeatureCode,
    useAddresses,
    useFeature,
    useMailSettings,
    useOrganization,
    useUser,
} from '@proton/components';
import { PassAliasesProvider } from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/PassAliasesProvider';
import { useFolders, useLabels } from '@proton/components/hooks/useCategories';
import useUserSettings from '@proton/components/hooks/useUserSettings';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { PassBridgeProvider } from '@proton/pass/lib/bridge/PassBridgeProvider';
import {
    ADDRESS_TYPE,
    BRAND_NAME,
    DRIVE_APP_NAME,
    MAILBOX_LABEL_IDS,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import { isDesktopInboxUser, isDriveUser, isPassUser, isVPNUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash';

import { MAIL_UPSELL_BANNERS_OPTIONS_URLS } from 'proton-mail/constants';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import useHasScheduledMessages from 'proton-mail/hooks/useHasScheduledMessages';
import useHasSnoozedMessages from 'proton-mail/hooks/useHasSnoozedMessages';
import type { TipData } from 'proton-mail/models/tip';
import { TipActionType } from 'proton-mail/models/tip';
import { useMailSelector } from 'proton-mail/store/hooks';

import PassAliasTipCTA from './PassAliasTipCTA';
import ProtonTipCTA from './ProtonTipCTA';

const PM_DOMAIN = 'pm.me';

// Suggested folder/label name shouldn't get translated
const suggestedFolderName = 'Receipts';
const suggestedLabelName = 'To pay';
const suggestedPaidLabelName = 'Paid';

const { vpn, drive, pass } = MAIL_UPSELL_BANNERS_OPTIONS_URLS;

const useTips = () => {
    const [addresses, loadingAddresses] = useAddresses();
    const [folders, loadingFolders] = useFolders();
    const [labels, loadingLabels] = useLabels();
    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingSettings] = useUserSettings();
    const activeAddresses = getActiveAddresses(addresses ?? []);
    const [missScopePass, setMissScopePass] = useState(false);
    const [organization, loadingOrganization] = useOrganization();

    const isB2BAudience = getIsB2BAudienceFromPlan(organization?.PlanName);

    const [hasSnoozedMessages, loadingSnoozedMessages] = useHasSnoozedMessages();
    const [hasScheduledMessages, loadingScheduledMessages] = useHasScheduledMessages();

    const loading =
        loadingSettings ||
        loadingMailSettings ||
        loadingAddresses ||
        loadingLabels ||
        loadingFolders ||
        loadingUser ||
        loadingSnoozedMessages ||
        loadingOrganization ||
        loadingScheduledMessages;

    const labelID = useMailSelector((store) => store.elements.params.labelID);
    const conversationMode = isConversationMode(labelID, mailSettings);

    const [isTipDismissed, setIsTipDismissed] = useState(false);
    const [shouldDisplayTips, setShouldDisplayTips] = useState(false);

    const protonTipsEnabled = useFlag('ProtonTips');
    const { feature } = useFeature(FeatureCode.ProtonTipsSnoozeTime);

    useEffect(() => {
        if (!feature) {
            return;
        }

        const displayTips = differenceInDays(new Date(), feature.Value) >= 60;
        setShouldDisplayTips(displayTips);
    }, [feature]);

    const showMeHowCTA = c('Tip Action').t`Show me how`;
    const openAppCTA = c('Tip Action').t`Open `;

    const tipMessages: TipData[] = useMemo(
        () => [
            {
                id: 0,
                icon: 'folders',
                // translator: the sentence contains a non-translatable text and is as follows: Create a folder such as "Receipts" to keep all your online receipts in one place.
                message: c('Info')
                    .t`Create a folder such as “${suggestedFolderName}“ to keep all your online receipts in one place.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.CreateFolder}
                        ctaText={c('Tip Action').t`Create “${suggestedFolderName}“ folder`}
                    />
                ),
                action: TipActionType.CreateFolder,
            },
            {
                id: 1,
                icon: 'tag',
                // translator: the sentence contains a non-translatable text and is as follows: Give incoming bills a color-coded label, such as "To Pay". Once they’re paid, change the label to "Paid".
                message: c('Info')
                    .t`Give incoming bills a color-coded label, such as “${suggestedLabelName}“. Once they're paid, change the label to “${suggestedPaidLabelName}“.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.CreateLabel}
                        ctaText={c('Tip Action').t`Create label “${suggestedLabelName}“`}
                    />
                ),
                action: TipActionType.CreateLabel,
            },
            {
                id: 2,
                icon: 'tv',
                message: c('Info')
                    .t`To avoid getting sidetracked by the open tabs in your browser, use the desktop app.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.DownloadDesktopApp}
                        ctaText={c('Tip Action').t`Download Desktop app`}
                        settingsUrl="/get-the-apps#proton-mail-desktop-apps"
                    />
                ),
                action: TipActionType.DownloadDesktopApp,
            },
            {
                id: 3,
                icon: 'at',
                message: c('Info')
                    .t`Did you know? We've reserved a shorter email address just for you. It's your username followed by “@${PM_DOMAIN}”.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.GetProtonSubdomainAddress}
                        ctaText={c('Tip Action').t`Get my “@${PM_DOMAIN}“ address`}
                        setIsTipDismissed={setIsTipDismissed}
                    />
                ),
                action: TipActionType.GetProtonSubdomainAddress,
            },
            {
                id: 4,
                icon: 'alias',
                message: c('Info')
                    .t`When you sign up for a newsletter, use an alias instead of your email address. Your identity stays hidden, and you can disable the alias at any time.`,
                cta: (
                    <ErrorBoundary
                        renderFunction={(e: any) => {
                            if (e?.message.includes(PassErrorCode.MISSING_SCOPE)) {
                                setMissScopePass(true);
                                return (
                                    <p className="m-0 text-weak text-sm">
                                        {c('Error message')
                                            .t`Aliases cannot be used when an extra password is enabled in ${PASS_APP_NAME}.`}
                                    </p>
                                );
                            }

                            return null;
                        }}
                    >
                        <PassBridgeProvider>
                            <PassAliasesProvider>
                                <PassAliasTipCTA ctaText={c('Tip Action').t`Create an alias`} />
                            </PassAliasesProvider>
                        </PassBridgeProvider>
                    </ErrorBoundary>
                ),
                action: TipActionType.CreateAlias,
            },
            {
                id: 5,
                icon: 'paper-plane-clock',
                message: c('Info')
                    .t`Consider when's the best time for your recipient to receive your email, and schedule it to be sent then.`,
                cta: <ProtonTipCTA actionType={TipActionType.ScheduleMessage} ctaText={showMeHowCTA} />,
                action: TipActionType.ScheduleMessage,
            },
            {
                id: 6,
                icon: 'trash-clock',
                message: c('Info')
                    .t`Keep your mailbox tidy by automatically clearing out trash and spam that have been there for more than 30 days.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.ClearMailbox}
                        ctaText={c('Tip Action').t`Activate`}
                        setIsTipDismissed={setIsTipDismissed}
                    />
                ),
                action: TipActionType.ClearMailbox,
            },
            {
                id: 7,
                icon: 'envelopes',
                message: c('Info')
                    .t`Use different email addresses for different purposes so you can easily separate your emails by work, personal, or other areas.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.CreateEmailAddress}
                        ctaText={c('Tip Action').t`Create new email address`}
                        settingsUrl="/identity-addresses#addresses"
                    />
                ),
                action: TipActionType.CreateEmailAddress,
            },
            {
                id: 8,
                icon: 'clock',
                message: c('Info')
                    .t`Don't have time to tackle an important email now, but don't want to forget about it? Set a better time for it to appear in your inbox.`,
                cta: <ProtonTipCTA actionType={TipActionType.SnoozeEmail} ctaText={showMeHowCTA} />,
                action: TipActionType.SnoozeEmail,
            },
            {
                id: 9,
                icon: 'shield-2-bolt',
                message: c('Info')
                    .t`If your password ends up on the dark web, ${BRAND_NAME} can tell you which service your data was leaked from and how to halt the damage.`,
                cta: (
                    <ProtonTipCTA
                        actionType={TipActionType.EnableDarkWebMonitoring}
                        ctaText={c('Tip Action').t`Enable Dark Web Monitoring`}
                        settingsUrl="/security#breaches"
                    />
                ),
                action: TipActionType.EnableDarkWebMonitoring,
            },
            {
                id: 10,
                icon: 'brand-proton-drive',
                message: c('Info')
                    .t`Did you know you have encrypted cloud storage included with your ${BRAND_NAME} Account? Head over to ${DRIVE_APP_NAME} and make the most of your space. It's free.`,
                // translator: Open Proton Drive
                cta: (
                    <Href href={drive} className="link align-baseline" tabIndex={0}>
                        {openAppCTA + `${DRIVE_APP_NAME}`}
                    </Href>
                ),
                action: TipActionType.OpenProtonDrive,
            },
            {
                id: 11,
                icon: 'brand-proton-pass',
                message: c('Info')
                    .t`Keep your login and credit card details safe but always on hand by adding it to ${PASS_APP_NAME}. It's free, and included with your ${BRAND_NAME} Account.`,
                // translator: Open Proton Pass
                cta: (
                    <Href href={pass} className="link align-baseline" tabIndex={0}>
                        {openAppCTA + `${PASS_APP_NAME}`}
                    </Href>
                ),
                action: TipActionType.OpenProtonPass,
            },
            {
                id: 12,
                icon: 'brand-proton-vpn',
                message: c('Info')
                    .t`When you're traveling or using public WiFi, connect to ${VPN_APP_NAME} to prevent anyone from tracking your online activity or stealing your data. It's free.`,
                // translator: Download Proton VPN
                cta: (
                    <Href href={vpn} className="link align-baseline" tabIndex={0}>
                        {c('Tip Action').t`Download ${VPN_APP_NAME}`}
                    </Href>
                ),
                action: TipActionType.DownloadProtonVPN,
            },
        ],
        []
    );

    const premiumAddresses = activeAddresses.filter(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
    const hasEnabledPremiumAddresses = premiumAddresses.length > 0;

    const showTip = (actionType: TipActionType) => {
        switch (actionType) {
            case TipActionType.CreateFolder:
                return (
                    !!folders &&
                    !folders.some((folder) => folder.Name.toLowerCase() === suggestedFolderName.toLowerCase())
                );
            case TipActionType.CreateLabel:
                return (
                    !!labels && !labels.some((label) => label.Name.toLowerCase() === suggestedLabelName.toLowerCase())
                );
            case TipActionType.DownloadDesktopApp:
                if (isElectronMail) {
                    return false;
                }
                return userSettings && !isDesktopInboxUser(BigInt(userSettings.UsedClientFlags));
            case TipActionType.GetProtonSubdomainAddress:
                return user.isFree || (user.isAdmin && !user.isSubUser && !hasEnabledPremiumAddresses);
            case TipActionType.CreateAlias:
                return !missScopePass;
            case TipActionType.ScheduleMessage:
                return !hasScheduledMessages;
            case TipActionType.ClearMailbox:
                return mailSettings
                    ? mailSettings.AutoDeleteSpamAndTrashDays !== AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE
                    : false;
            case TipActionType.CreateEmailAddress:
                if (user.isFree || user.isSubUser) {
                    return true;
                }
                if (user.isAdmin) {
                    return hasEnabledPremiumAddresses ? premiumAddresses.length <= 2 : premiumAddresses.length <= 1;
                }
                return false;
            case TipActionType.SnoozeEmail:
                const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;
                return conversationMode && isInbox && !hasSnoozedMessages;
            case TipActionType.EnableDarkWebMonitoring:
                return userSettings
                    ? userSettings.BreachAlerts.Eligible === 0 || userSettings.BreachAlerts.Value === 0
                    : false;
            case TipActionType.OpenProtonPass:
                return userSettings && !isPassUser(BigInt(userSettings.UsedClientFlags));
            case TipActionType.OpenProtonDrive:
                return userSettings && !isDriveUser(BigInt(userSettings.UsedClientFlags));
            case TipActionType.DownloadProtonVPN:
                return userSettings && !isVPNUser(BigInt(userSettings.UsedClientFlags));
            default:
                return false;
        }
    };

    const tips = loading ? [] : tipMessages.filter((tip) => showTip(tip.action));
    return {
        tips,
        isTipDismissed,
        setIsTipDismissed,
        shouldDisplayTips: !isB2BAudience && shouldDisplayTips && protonTipsEnabled,
    };
};

export default useTips;
