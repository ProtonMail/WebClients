import { useRef, useState } from 'react';
import { c } from 'ttag';

import { isMac } from '@proton/shared/lib/helpers/browser';
import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import { AutoReplyDuration, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import { removeImagesFromContent } from '@proton/shared/lib/sanitize/purify';
import {
    useMailSettings,
    useLoading,
    useApi,
    useNotifications,
    useEventManager,
    useHotkeys,
    useHandler,
    useUser,
    useErrorHandler,
} from '../../hooks';
import { Toggle, SimpleSquireEditor, Button } from '../../components';

import { SettingsParagraph, SettingsSectionWide } from '../account';

import { SquireEditorRef } from '../../components/editor/SquireEditor';

import AutoReplyFormMonthly from './AutoReplyForm/AutoReplyFormMonthly';
import AutoReplyFormDaily from './AutoReplyForm/AutoReplyFormDaily';
import AutoReplyFormWeekly from './AutoReplyForm/AutoReplyFormWeekly';
import AutoReplyFormPermanent from './AutoReplyForm/AutoReplyFormPermanent';
import AutoReplyFormFixed from './AutoReplyForm/AutoReplyFormFixed';
import DurationField from './AutoReplyForm/fields/DurationField';
import useAutoReplyForm, { getDefaultAutoResponder } from './AutoReplyForm/useAutoReplyForm';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import UpgradeBanner from '../account/UpgradeBanner';

const AutoReplySection = () => {
    const errorHandler = useErrorHandler();
    const [{ hasPaidMail }] = useUser();
    const [mailSettings] = useMailSettings();
    const { Shortcuts = 0 } = mailSettings || {};
    const AutoResponder = mailSettings?.AutoResponder || getDefaultAutoResponder();
    const api = useApi();
    const { call } = useEventManager();
    const [enablingLoading, withEnablingLoading] = useLoading();
    const [updatingLoading, withUpdatingLoading] = useLoading();
    const [isEnabled, setIsEnabled] = useState(AutoResponder.IsEnabled);
    const { createNotification } = useNotifications();
    const { model, updateModel, toAutoResponder } = useAutoReplyForm(AutoResponder);

    const editorRef = useRef<SquireEditorRef>(null);
    const composerRef = useRef<HTMLDivElement>(null);

    const handleToggle = async (enable: boolean) => {
        if (!hasPaidMail) {
            throw new Error(
                c('Error').t`Automatic replies is a paid feature. Please upgrade to a paid account to use this feature.`
            );
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
            if (editorRef.current) {
                editorRef.current.value = model.message;
            }
        }

        await api(updateAutoresponder(toAutoResponder({ ...model, message })));
        await call();
        createNotification({ text: c('Success').t`Auto-reply updated` });
    };

    const handleEditorReady = () => {
        if (editorRef.current) {
            editorRef.current.value = model.message;
        }
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

    const squireKeydownHandler = useHandler((e: KeyboardEvent) => {
        const ctrlOrMetaKey = (e: KeyboardEvent) => (isMac() ? e.metaKey : e.ctrlKey);

        if (!e.key) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'enter':
                if (Shortcuts && ctrlOrMetaKey(e)) {
                    void withUpdatingLoading(handleSubmit());
                }
                break;
            default:
                break;
        }
    });

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

    const renderForm = () => (
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
                    <label className="text-semibold" onClick={() => editorRef.current?.focus()}>
                        {c('Label').t`Message`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <div ref={composerRef} tabIndex={-1} className="w100">
                        <SimpleSquireEditor
                            ref={editorRef}
                            supportImages={false}
                            onReady={handleEditorReady}
                            onChange={updateModel('message')}
                            keydownHandler={squireKeydownHandler}
                        />
                    </div>

                    <Button
                        color="norm"
                        type="submit"
                        disabled={updatingLoading}
                        loading={updatingLoading}
                        className="mt1"
                    >
                        {c('Action').t`Save`}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>
        </form>
    );

    return (
        <SettingsSectionWide className="no-scroll">
            <SettingsParagraph className="mt0 mb1">
                {c('Info')
                    .t`Use automatic replies to inform contacts you are out of the office or otherwise unable to respond.`}
            </SettingsParagraph>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="autoReplyToggle" className="on-mobile-pb0 on-mobile-no-border text-semibold">
                        {c('Label').t`Auto reply`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
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
                isEnabled && renderForm()
            ) : (
                <UpgradeBanner className="mt2">
                    {c('Info').t`Upgrade to a ${PLAN_NAMES[PLANS.VISIONARY]} or ${
                        PLAN_NAMES[PLANS.PROFESSIONAL]
                    } plan to enable automatic replies for when you are out of the office.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default AutoReplySection;
