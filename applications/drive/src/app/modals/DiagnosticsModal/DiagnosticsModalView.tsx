import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tabs,
} from '@proton/components';

import { Device } from './Device';
import { Diagnostics } from './Diagnostics';
import { Logs } from './Logs';

export function DiagnosticsModalView({ open, onClose, onExit }: ModalStateProps) {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <ModalTwo size="full" open={open} onClose={onClose} onExit={onExit}>
            <ModalTwoHeader title={c('Title').t`Diagnostics`} />
            <ModalTwoContent>
                <Tabs
                    value={tabIndex}
                    onChange={setTabIndex}
                    tabs={[
                        {
                            title: c('Title').t`Logs`,
                            content: <Logs />,
                        },
                        {
                            title: c('Title').t`Device`,
                            content: <Device />,
                        },
                        {
                            title: c('Title').t`Diagnostics`,
                            content: <Diagnostics />,
                        },
                    ]}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
