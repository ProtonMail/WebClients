import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Editor from '@proton/components/components/editor/Editor';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import type { EditorActions } from '@proton/components/components/editor/interface';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import {
    APP_UPSELL_REF_PATH,
    AutoReplyDuration,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { removeImagesFromContent } from '@proton/shared/lib/sanitize/purify';

import { useApi, useErrorHandler, useEventManager, useHotkeys, useNotifications, useUser } from '../../hooks';
import UpgradeBanner from '../account/UpgradeBanner';
import AutoReplyFormDaily from './AutoReplyForm/AutoReplyFormDaily';
import AutoReplyFormFixed from './AutoReplyForm/AutoReplyFormFixed';
import AutoReplyFormMonthly from './AutoReplyForm/AutoReplyFormMonthly';
import AutoReplyFormPermanent from './AutoReplyForm/AutoReplyFormPermanent';
import AutoReplyFormWeekly from './AutoReplyForm/AutoReplyFormWeekly';
import DurationField from './AutoReplyForm/fields/DurationField';
import useAutoReplyForm, { getDefaultAutoResponder } from './AutoReplyForm/useAutoReplyForm';

const AUTO_REPLY_MAX_LENGTH = 4096;

export const AutoReplySection = () => {
    const errorHandler = useErrorHandler();
    const [{ hasPaidMail }] = useUser();
    const [mailSettings] = useMailSettings();
    const { Shortcuts } = mailSettings || DEFAULT_MAILSETTINGS;
    const AutoResponder = mailSettings?.AutoResponder || getDefaultAutoResponder();
    const api = useApi();
    const { call } = useEventManager();
    const [enablingLoading, withEnablingLoading] = useLoading();
    const [updatingLoading, withUpdatingLoading] = useLoading();
    const [isEnabled, setIsEnabled] = useState(AutoResponder.IsEnabled);
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(AutoResponder);

    const editorActionsRef = useRef<EditorActions>();
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

        setIsEnabled(enable);

        const isDisablingExistingAutoResponder =
            !enable && mailSettings?.AutoResponder && mailSettings?.AutoResponder.IsEnabled;

        if (enable || !isDisablingExistingAutoResponder) {
            return;
        }

        await api({
            ...updateAutoresponder({ ...AutoResponder, IsEnabled: enable }),
            silence: true,
        });
        await call();
        createNotification({
            text: c('Success').t`Auto-reply disabled`,
        });
    };

    const handleSubmit = async () => {
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

        await api(updateAutoresponder(toAutoResponder({ ...model, message })));
        await call();
        createNotification({ text: c('Success').t`Auto-reply updated` });
    };

    const handleEditorReady = (actions: EditorActions) => {
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
            case AutoReplyDuration.PERMANENT:
                return <AutoReplyFormPermanent />;
            default:
                return null;
        }
    };

    useHotkeys(composerRef, [
        [
            ['Meta', 'Enter'],
            async () => {
                if (Shortcuts) {
                    await withUpdatingLoading(handleSubmit());
                }
            },
        ],
    ]);

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.AUTO_REPLY,
    });

    return (
        <SettingsSectionWide className="overflow-hidden">
            <SettingsParagraph className="mt-0 mb-4">
                {c('new_plans: info')
                    .t`Set automatic replies to inform senders you are out of the office or unable to respond.`}
            </SettingsParagraph>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="autoReplyToggle" className="text-semibold">
                        {c('Label').t`Auto-reply`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="autoReplyToggle"
                        loading={enablingLoading}
                        checked={isEnabled}
                        onChange={({ target: { checked } }) =>
                            withEnablingLoading(handleToggle(checked).catch(errorHandler))
                        }
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            {hasPaidMail ? (
                isEnabled && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await withUpdatingLoading(handleSubmit());
                        }}
                    >
                        <DurationField value={model.duration} onChange={updateModel('duration')} />

                        {formRenderer(model.duration)}

                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label className="text-semibold" onClick={() => editorActionsRef.current?.focus()}>
                                    {c('Label').t`Message`}
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight>
                                <div ref={composerRef} tabIndex={-1} className="w-full">
                                    <Editor
                                        metadata={{ supportImages: false }}
                                        onReady={handleEditorReady}
                                        onChange={updateModel('message')}
                                        simple
                                        openEmojiPickerRef={openEmojiPickerRef}
                                        toolbarConfig={toolbarConfig}
                                        setToolbarConfig={setToolbarConfig}
                                        modalLink={modalLink}
                                        modalImage={modalImage}
                                        modalDefaultFont={modalDefaultFont}
                                        mailSettings={mailSettings}
                                    />
                                </div>
                                {messageLimitReached && (
                                    <p className="mt-1 mb-0 color-danger">{c('Error')
                                        .t`Auto-reply message exceeds the allowed length. Please shorten it to fit within the limit.`}</p>
                                )}

                                <Button
                                    color="norm"
                                    type="submit"
                                    disabled={updatingLoading || messageLimitReached}
                                    loading={updatingLoading}
                                    className="mt-4"
                                >
                                    {c('Action').t`Save`}
                                </Button>
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    </form>
                )
            ) : (
                <UpgradeBanner className="mt-8" upsellPath={upsellRef}>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};
