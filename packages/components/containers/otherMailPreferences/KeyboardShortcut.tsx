import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import ShortcutsToggle from '@proton/components/containers/general/ShortcutsToggle';
import MailShortcutsModal from '@proton/components/containers/mail/MailShortcutsModal';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

export const KeyboardShortcut = () => {
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="flex-1">
                        <span className="text-semibold">{c('Title').t`Keyboard shortcuts`}</span>
                        <button
                            type="button"
                            className="ml-2 inline-flex relative interactive-pseudo-protrude interactive--no-background"
                            onClick={(e) => {
                                e.preventDefault();
                                setMailShortcutsModalOpen(true);
                            }}
                        >
                            <IcInfoCircle
                                className="color-primary"
                                alt={c('Action').t`More info: Keyboard shortcuts`}
                                size={4}
                            />
                        </button>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <ShortcutsToggle className="mr-4" id="shortcutsToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};
