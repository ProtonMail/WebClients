import type { ReactNode } from 'react';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { Tabs } from '@proton/components/components/tabs/Tabs';

interface Tab {
    title: string;
    titleNode?: ReactNode;
    content: ReactNode;
}

interface Props {
    title: string;
    tabs: Tab[];
    tabIndex: number;
    onChangeTabIndex: (index: number) => void;
}

const ModalHeaderWithTabs = ({ title, tabs, tabIndex, onChangeTabIndex }: Props) => {
    if (tabs.length <= 1) {
        return (
            <>
                <ModalHeader title={title} />
                <ModalContent>{tabs[0]?.content}</ModalContent>
            </>
        );
    }

    return (
        <>
            <ModalHeader
                title={title}
                additionalContent={
                    <div style={{ marginInlineStart: 'calc(-1 * var(--space-3))' }}>
                        <Tabs
                            className="mb-2"
                            tabs={tabs.map(({ title, titleNode }) => ({ title, titleNode }))}
                            value={tabIndex}
                            onChange={onChangeTabIndex}
                        />
                    </div>
                }
            />
            <ModalContent>{tabs[tabIndex]?.content}</ModalContent>
        </>
    );
};

export default ModalHeaderWithTabs;
