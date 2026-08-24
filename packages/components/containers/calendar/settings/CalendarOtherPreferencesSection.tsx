import { c } from 'ttag';

import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import useModalState from '../../../components/modalTwo/useModalState';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import SettingsSection from '../../account/SettingsSection';
import ShortcutsToggle from '../../general/ShortcutsToggle';
import CalendarShortcutsModal from '../shortcutsModal/CalendarShortcutsModal';

const CalendarOtherPreferencesSection = () => {
    const [calendarShortcutsProps, setCalendarShortcutsModalOpen, renderCalendarShortcutsModal] = useModalState();

    return (
        <>
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="toggle-shortcuts" className="flex-1">
                            <span className="text-semibold">{c('Label').t`Keyboard shortcuts`}</span>
                            <button
                                type="button"
                                className="ml-2 inline-flex relative interactive-pseudo-protrude interactive--no-background"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCalendarShortcutsModalOpen(true);
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
                        <ShortcutsToggle className="mr-4" id="toggle-shortcuts" />
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
            {renderCalendarShortcutsModal && <CalendarShortcutsModal {...calendarShortcutsProps} />}
        </>
    );
};

export default CalendarOtherPreferencesSection;
