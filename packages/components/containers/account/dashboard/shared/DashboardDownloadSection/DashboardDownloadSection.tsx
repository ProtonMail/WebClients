import { useState } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import './DashboardDownloadSection.scss';

interface DownloadLink {
    title: () => string;
    link: string;
    external?: boolean;
}

interface DownloadButton {
    title: () => string;
    links?: DownloadLink[];
    link?: string;
    style?: 'appstore' | 'external';
    image?: string;
}

interface TabContent {
    image?: string;
    hint?: string;
    downloadButtons?: DownloadButton[];
    footnote?: {
        title: () => string;
        link: string;
    };
}

interface CategoryTab {
    title: () => string;
    icon: IconName;
    content: TabContent;
}

interface Category {
    title: () => string;
    tabs: CategoryTab[];
    enabled?: boolean;
}

const CategoryTabs = ({ category }: { category: Category }) => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const subTabs = category.tabs.map((tab: CategoryTab) => ({
        title: tab.title(),
        icon: tab.icon,
        iconPosition: 'leading' as const,
        content: (
            <div key={tab.title()} className="pb-2 flex flex-column gap-6">
                {tab.content.image ? (
                    <figure
                        className="flex justify-center m-0 md:w-8/10 mx-auto max-w-custom"
                        style={{
                            aspectRatio: '1.778',
                            '--max-w-custom': '25rem',
                        }}
                    >
                        <img src={tab.content.image} alt={tab.title()} className="w-full h-auto" />
                    </figure>
                ) : undefined}
                <div>
                    <div className="flex gap-4 w-full">
                        {tab.content.downloadButtons?.map((downloadButton) => {
                            return (
                                <div className="flex-1" key={downloadButton.title()}>
                                    {downloadButton.links ? (
                                        <>
                                            <DropdownButton
                                                fullWidth
                                                color="norm"
                                                className="justify-center"
                                                ref={anchorRef}
                                                isOpen={isOpen}
                                                onClick={toggle}
                                                hasCaret
                                            >
                                                {downloadButton.title()}
                                            </DropdownButton>
                                            <Dropdown
                                                isOpen={isOpen}
                                                anchorRef={anchorRef}
                                                onClose={close}
                                                size={{
                                                    width: DropdownSizeUnit.Dynamic,
                                                    maxWidth: DropdownSizeUnit.Viewport,
                                                }}
                                            >
                                                <DropdownMenu>
                                                    {downloadButton.links.map((download: DownloadLink) => (
                                                        <DropdownMenuLink
                                                            href={download.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-left flex flex-nowrap items-center justify-space-between gap-2"
                                                            key={download.title()}
                                                        >
                                                            <span>{download.title()}</span>
                                                            <IcArrowDownLine className="ml-auto shrink-0" />
                                                        </DropdownMenuLink>
                                                    ))}
                                                </DropdownMenu>
                                            </Dropdown>
                                        </>
                                    ) : undefined}

                                    {downloadButton.link ? (
                                        <ButtonLike
                                            as="a"
                                            color="norm"
                                            fullWidth
                                            className={clsx(
                                                downloadButton.style === 'appstore' &&
                                                    'dashboard-download-section-button-appstore',
                                                downloadButton.style === 'external' &&
                                                    'dashboard-download-section-button-appstore'
                                            )}
                                            href={downloadButton.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={downloadButton.title()}
                                        >
                                            {downloadButton.image ? (
                                                <img src={downloadButton.image} alt={downloadButton.title()} />
                                            ) : (
                                                downloadButton.title()
                                            )}

                                            {downloadButton.style === 'external' && (
                                                <IcArrowOutSquare className="ml-1 shrink-0" />
                                            )}
                                        </ButtonLike>
                                    ) : undefined}
                                </div>
                            );
                        })}
                    </div>
                    {tab.content.footnote ? (
                        <footer className="mt-4 flex justify-center">
                            <ButtonLike
                                as="a"
                                color="norm"
                                shape="underline"
                                href={tab.content.footnote.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {tab.content.footnote.title()}
                                <IcArrowOutSquare className="ml-1 shrink-0" />
                            </ButtonLike>
                        </footer>
                    ) : undefined}
                </div>
            </div>
        ),
    }));

    return (
        <Tabs
            tabs={subTabs as Tab[]}
            variant="underline"
            fullWidth
            value={activeTabIndex}
            onChange={setActiveTabIndex}
        />
    );
};

interface Props {
    downloadConfig: Category[];
}
const DashboardDownloadSection = ({ downloadConfig }: Props) => {
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const categoryTabs = downloadConfig
        .filter(({ enabled }) => enabled)
        .map((category) => ({
            title: category.title(),
            content: <CategoryTabs category={category} />,
        }));
    return (
        <DashboardCard>
            <DashboardCardContent>
                <Tabs
                    tabs={categoryTabs as Tab[]}
                    variant="modern"
                    fullWidth
                    value={activeCategoryIndex}
                    onChange={setActiveCategoryIndex}
                />
            </DashboardCardContent>
        </DashboardCard>
    );
};

export default DashboardDownloadSection;
