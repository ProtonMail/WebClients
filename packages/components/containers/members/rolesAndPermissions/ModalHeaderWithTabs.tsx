import type { CSSProperties, ReactNode } from 'react';

import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalHeader from '../../../components/modalTwo/ModalHeader';
import { Tabs } from '../../../components/tabs/Tabs';

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
    style?: CSSProperties;
}

const ModalHeaderWithTabs = ({ title, tabs, tabIndex, onChangeTabIndex, style }: Props) => {
    if (tabs.length <= 1) {
        return (
            <>
                <ModalHeader title={title} />
                <ModalContent style={style}>{tabs[0]?.content}</ModalContent>
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
            <ModalContent style={style}>{tabs[tabIndex]?.content}</ModalContent>
        </>
    );
};

export default ModalHeaderWithTabs;
