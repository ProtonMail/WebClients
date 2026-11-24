import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import UpgradeBanner from '@proton/components/containers/account/UpgradeBanner';
import type { SimpleEditorActions } from '@proton/components/containers/editor/SimpleEditorContext';
import { useSimpleEditor } from '@proton/components/containers/editor/SimpleEditorContext';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useHotkeys } from '@proton/hooks/useHotkeys';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { removeImagesFromContent } from '@proton/sanitize/purify';
import {
    APP_UPSELL_REF_PATH,
    AutoReplyDuration,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';

import AutoReplyFormDaily from './AutoReplyForm/AutoReplyFormDaily';
import AutoReplyFormFixed from './AutoReplyForm/AutoReplyFormFixed';
import AutoReplyFormMonthly from './AutoReplyForm/AutoReplyFormMonthly';
import AutoReplyFormWeekly from './AutoReplyForm/AutoReplyFormWeekly';
import DurationField from './AutoReplyForm/fields/DurationField';
import useAutoReplyForm, { getDefaultAutoResponder } from './AutoReplyForm/useAutoReplyForm';

const AUTO_REPLY_MAX_LENGTH = 10_000;

export const AutoReplySection = () => {
    const errorHandler = useErrorHandler();
    const [{ hasPaidMail }] = useUser();
    const [mailSettings] = useMailSettings();
    const AutoResponder = mailSettings.AutoResponder || getDefaultAutoResponder();
    const { update, isLoading } = useUpdateMailSetting();
    const [isEnabled, setIsEnabled] = useState(AutoResponder.IsEnabled);
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(AutoResponder);

    const SimpleEditor = useSimpleEditor();
    const editorActionsRef = useRef<SimpleEditorActions>(undefined);
    const composerRef = useRef<HTMLDivElement>(null);

    const messageLimitReached = model.message.length > AUTO_REPLY_MAX_LENGTH;

    const handleToggle = async (enable: boolean) => {
        if (!hasPaidMail) {
            const error: any = new Error(
                c('Error').t`Automatic replies is a paid feature. Please upgrade to a paid account to use this feature.`
            );
            error.trace = false;
            throw error;
        }

        const isDisablingExistingAutoResponder =
            !enable && mailSettings.AutoResponder && mailSettings.AutoResponder.IsEnabled;

        if (!isDisablingExistingAutoResponder) {
            setIsEnabled(enable);
            return;
        }

        // The toggle only moves once the request succeeded, so a failure leaves it on, like the server
        update(
            'AutoResponder',
            { ...AutoResponder, IsEnabled: false },
            { notify: c('Success').t`Auto-reply disabled`, onSuccess: () => setIsEnabled(false) }
        );
    };

    const handleSubmit = () => {
        // Remove images from the composer in autoreply
        const { message, containsImages } = removeImagesFromContent(model.message);
        if (containsImages) {
            createNotification({
                type: 'warning',
                text: c('Info').t`Images have been removed because they are not allowed in auto-reply`,
            });

            updateModel('message').bind(message);
            // update the composer to remove the image from it
            if (editorActionsRef.current) {
                editorActionsRef.current.setContent(model.message);
            }
        }

        update('AutoResponder', toAutoResponder({ ...model, message }), { notify: c('Success').t`Auto-reply updated` });
    };

    const handleEditorReady = (actions: SimpleEditorActions) => {
        editorActionsRef.current = actions;
        actions.setContent(model.message);
    };

    const formRenderer = (duration: AutoReplyDuration) => {
        switch (duration) {
            case AutoReplyDuration.FIXED:
                return <AutoReplyFormFixed model={model} updateModel={updateModel} />;
            case AutoReplyDuration.DAILY:
                return <AutoReplyFormDaily model={model} updateModel={updateModel} />;
            case AutoReplyDuration.MONTHLY:
                return <AutoReplyFormMonthly model={model} updateModel={updateModel} />;
            case AutoReplyDuration.WEEKLY:
                return <AutoReplyFormWeekly model={model} updateModel={updateModel} />;
            default:
                return null;
        }
    };

    useHotkeys(composerRef, [
        [
            ['Meta', 'Enter'],
            () => {
                if (mailSettings.Shortcuts) {
                    handleSubmit();
                }
            },
        ],
    ]);

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.AUTO_REPLY,
    });

    return (
        <DashboardGrid as="div">
            <DashboardGridSectionHeader
                title={c('Title').t`Auto-reply`}
                subtitle={c('new_plans: info')
                    .t`Set automatic replies to inform senders you are out of the office or unable to respond.`}
            />
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsToggleRow
                        id="autoReplyToggle"
                        label={<SettingsToggleRow.Label>{c('Label').t`Auto-reply`}</SettingsToggleRow.Label>}
                        toggle={
                            <SettingsToggleRow.Toggle
                                loading={isLoading('AutoResponder')}
                                checked={isEnabled}
                                onChange={({ target: { checked } }) => {
                                    handleToggle(checked).catch(errorHandler);
                                }}
                            />
                        }
                    />

                    {hasPaidMail && isEnabled && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                        >
                            <DashboardCardDivider />

                            <div className="flex flex-column flex-nowrap gap-6">
                                <DurationField value={model.duration} onChange={updateModel('duration')} />
                                {formRenderer(model.duration)}
                            </div>

                            <DashboardCardDivider />

                            <div className="flex flex-column flex-nowrap gap-3">
                                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                                <label
                                    htmlFor="rooster-editor"
                                    className="text-semibold"
                                    onClick={() => editorActionsRef.current?.focus()}
                                >
                                    {c('Label').t`Message`}
                                </label>
                                <div ref={composerRef} tabIndex={-1} className="w-full">
                                    <SimpleEditor
                                        supportFiles={false}
                                        onReady={handleEditorReady}
                                        onChange={updateModel('message')}
                                        mailSettings={mailSettings}
                                        title={c('Label').t`Message (auto-reply)`}
                                    />
                                </div>
                                {messageLimitReached && (
                                    <p className="m-0 color-danger">{c('Error')
                                        .t`Auto-reply message exceeds the allowed length. Please shorten it to fit within the limit.`}</p>
                                )}
                                <div>
                                    <Button
                                        color="norm"
                                        type="submit"
                                        disabled={isLoading('AutoResponder') || messageLimitReached}
                                        loading={isLoading('AutoResponder')}
                                    >
                                        {c('Action').t`Save`}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </DashboardCardContent>
            </DashboardCard>
            {!hasPaidMail && (
                <UpgradeBanner promotion upsellPath={upsellRef}>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
                </UpgradeBanner>
            )}
        </DashboardGrid>
    );
};
