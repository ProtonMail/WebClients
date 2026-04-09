import type { ReactNode } from 'react';
import { useState } from 'react';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { Tabs } from '@proton/components/components/tabs/Tabs';

interface Tab {
    title: string;
    content: ReactNode;
}

interface Props {
    title: string;
    tabs: Tab[];
}

const ModalHeaderWithTabs = ({ title, tabs }: Props) => {
    const [activeTab, setActiveTab] = useState(0);

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
                            tabs={tabs.map(({ title }) => ({ title }))}
                            value={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>
                }
            />
            <ModalContent>{tabs[activeTab]?.content}</ModalContent>
        </>
    );
};

export default ModalHeaderWithTabs;
