import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Field, Label, useMailSettings, SmallButton, useModals } from 'react-components';

import ShortcutsToggle from './ShortcutsToggle';
import ShortcutsModal from './ShortcutsModal';

const ShortcutsSection = () => {
    const [mailSettings] = useMailSettings();
    const [hotkeys, setHotkeys] = useState(mailSettings.Hotkeys);
    const { createModal } = useModals();

    // Handle updates from the Event Manager.
    useEffect(() => {
        setHotkeys(mailSettings.Hotkeys);
    }, [mailSettings.Hotkeys]);

    const handleChange = (newValue) => setHotkeys(newValue);

    const handleOpenModal = () => createModal(<ShortcutsModal />);

    return (
        <>
            <SubTitle>{c('Title').t`Shortcuts`}</SubTitle>
            <Row>
                <Label htmlFor="hotkeysToggle">{c('Title').t`Keyboard shortcuts`}</Label>
                <Field>
                    <ShortcutsToggle id="hotkeysToggle" hotkeys={hotkeys} onChange={handleChange} />
                    <SmallButton onClick={handleOpenModal}>{c('Action').t`View keyboard shortcuts`}</SmallButton>
                </Field>
            </Row>
        </>
    );
};

export default ShortcutsSection;
