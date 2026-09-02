import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import clsx from '@proton/utils/clsx';

import Dropdown from '../../../../../components/dropdown/Dropdown';
import DropdownButton from '../../../../../components/dropdown/DropdownButton';
import DropdownMenu from '../../../../../components/dropdown/DropdownMenu';
import DropdownMenuLink from '../../../../../components/dropdown/DropdownMenuLink';
import { DropdownSizeUnit } from '../../../../../components/dropdown/utils';
import { Tabs } from '../../../../../components/tabs/Tabs';
import { getTelemetryUserTier } from '../../../../../helpers/getTelemetryUserTier';
import { mapTelemetryOsVersionWithStore } from '../../../../../helpers/mapTelemetryOsVersionWithStore';

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
    hint?: () => ReactNode;
    downloadButtons?: DownloadButton[];
    footnote?: {
        title: () => string;
        link: string;
    };
}

interface CategoryTab {
    title: () => string;
    icon: ReactElement;
    content: TabContent;
}

interface Category {
    title: () => string;
    tabs: CategoryTab[];
    enabled?: boolean;
}

const CategoryTabs = ({ category, app }: { category: Category; app: APP_NAMES }) => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const api = useApi();
    const [user] = useUser();

    const handleDownloadClick = (destination: string) => {
        if (app) {
            void sendTelemetryReport({
                api,
                delay: false,
                event: TelemetryAccountDashboardEvents.downloadCtaClick,
                measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                dimensions: {
                    app,
                    download_destination: mapTelemetryOsVersionWithStore(destination),
                    user_tier: getTelemetryUserTier(user),
                },
            });
        }
    };

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
                {tab.content.hint && <p className="my-0 color-weak text-center text-sm">{tab.content.hint()}</p>}
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
                                                            onClick={() => handleDownloadClick(tab.title())}
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
                                            onClick={() => handleDownloadClick(tab.title())}
                                        >
                                            {downloadButton.image ? (
                                                <img src={downloadButton.image} alt={downloadButton.title()} />
                                            ) : (
                                                downloadButton.title()
                                            )}

                                            {downloadButton.style === 'external' && (
                                                <IcArrowOutSquare className="ml-1 shrink-0 rtl:mirror" />
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
                                <IcArrowOutSquare className="ml-1 shrink-0 rtl:mirror" />
                            </ButtonLike>
                        </footer>
                    ) : undefined}
                </div>
            </div>
        ),
    }));

    return <Tabs tabs={subTabs} variant="underline" fullWidth value={activeTabIndex} onChange={setActiveTabIndex} />;
};

interface Props {
    downloadConfig: Category[];
    app: APP_NAMES;
}
const DashboardDownloadSection = ({ downloadConfig, app }: Props) => {
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    const categoryTabs = downloadConfig
        .filter(({ enabled }) => enabled)
        .map((category) => ({
            title: category.title(),
            content: <CategoryTabs category={category} app={app} />,
        }));
    return (
        <DashboardCard>
            <DashboardCardContent>
                <Tabs
                    tabs={categoryTabs}
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
