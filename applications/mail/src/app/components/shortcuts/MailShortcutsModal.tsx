import React from 'react';
import { Alert, ShortcutsModal, ShortcutsSectionView, useMailSettings, classnames, AppLink } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { c } from 'ttag';
import mailShortcuts from './shortcuts';

interface Props {
    onClose?: () => void;
}

const MailShortCutsModal = ({ ...rest }: Props) => {
    const appName = getAppName(APPS.PROTONMAIL);
    const title = c('Title').t`${appName} Keyboard Shortcuts`;

    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const alwaysOnSections = mailShortcuts.filter((section) => section.alwaysActive);
    const shortcutEnabledSections = mailShortcuts.filter((section) => !section.alwaysActive);

    const settingsLink = (
        <AppLink to="/settings/general#shortcuts" key="settings-link" onClick={() => rest.onClose?.()}>
            {c('Link').t`general settings.`}
        </AppLink>
    );

    return (
        <ShortcutsModal title={title} {...rest}>
            <Alert className="mb1">
                {c('Info')
                    .t`Basic navigation and actions remain available regardless of keyboard shortcuts being active or not in the settings.`}
            </Alert>
            <div className="list-2columns onmobile-list-1column mr-2e onmobile-mr0">
                {alwaysOnSections.map((section) => {
                    return <ShortcutsSectionView key={section.name} {...section} />;
                })}
            </div>

            <hr className="mt2 mb2 border-bottom" />

            <Alert>
                {Shortcuts
                    ? c('Info').t`Your keyboard shortcuts are active`
                    : c('Info').jt`To activate your keyboard shortcuts, go to ${settingsLink}`}
            </Alert>
            <div
                className={classnames([
                    'list-2columns onmobile-list-1column mr-2e onmobile-mr0',
                    !Shortcuts && 'opacity-50',
                ])}
            >
                {shortcutEnabledSections.map((section) => {
                    return <ShortcutsSectionView key={section.name} {...section} />;
                })}
            </div>
        </ShortcutsModal>
    );
};

export default MailShortCutsModal;
