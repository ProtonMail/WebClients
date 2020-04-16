import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Label, Field, useMailSettings, useModals, SmallButton, ShortcutsModal } from 'react-components';

import ShortcutsToggle from './ShortcutsToggle';

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
                    <div>
                        <ShortcutsToggle className="mr1" id="hotkeysToggle" hotkeys={hotkeys} onChange={handleChange} />
                    </div>
                    {hotkeys ? (
                        <div className="mt1">
                            <SmallButton onClick={handleOpenModal}>{c('Action')
                                .t`View keyboard shortcuts`}</SmallButton>
                        </div>
                    ) : null}
                </Field>
            </Row>
        </>
    );
};

export default ShortcutsSection;
