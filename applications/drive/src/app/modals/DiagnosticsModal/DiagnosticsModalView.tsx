import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { Tabs } from '@proton/components/components/tabs/Tabs';

import { Device } from './Device';
import { Diagnostics } from './Diagnostics';
import { Logs } from './Logs';
import { Search } from './Search';

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
                        {
                            title: c('Title').t`Search`,
                            content: <Search />,
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
