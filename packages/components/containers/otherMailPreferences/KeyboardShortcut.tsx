import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';

import useModalState from '../../components/modalTwo/useModalState';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import ShortcutsToggle from '../general/ShortcutsToggle';
import MailShortcutsModal from '../mail/MailShortcutsModal';

export const KeyboardShortcut = () => {
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    return (
        <>
            <SettingsToggleRow
                id="shortcutsToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Title').t`Keyboard shortcuts`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            <InlineLinkButton onClick={() => setMailShortcutsModalOpen(true)}>
                                {c('Action').t`View keyboard shortcuts`}
                            </InlineLinkButton>
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<ShortcutsToggle id="shortcutsToggle" />}
            />
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};
