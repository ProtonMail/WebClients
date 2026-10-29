import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Vr } from '@proton/atoms/Vr/Vr';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { Tabs } from '@proton/components/components/tabs/Tabs';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { CustomizeTab, SkillsView } from '../customizeTabs';

interface CustomizePageHeaderProps {
    activeTab: CustomizeTab;
    onTabChange: (tab: CustomizeTab) => void;
    skillsView: SkillsView;
    onSkillsViewChange: (view: SkillsView) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onCreateSkill: () => void;
    onUploadSkill: () => void;
}

const AddSkillMenu = ({ onCreate, onUpload }: { onCreate: () => void; onUpload: () => void }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                ref={anchorRef}
                className="shrink-0"
                color="norm"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <span className="flex flex-nowrap items-center gap-2">
                    <LumoIcon name="Plus" size={16} />
                    {c('collider_2025:Button').t`Add`}
                </span>
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    <DropdownMenuButton className="flex flex-nowrap items-center gap-2 text-left" onClick={onCreate}>
                        <LumoIcon name="Pen" size={16} />
                        {c('collider_2025:Action').t`Create a skill`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="flex flex-nowrap items-center gap-2 text-left" onClick={onUpload}>
                        <LumoIcon name="Upload" size={16} />
                        {c('collider_2025:Action').t`Upload a skill`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface SegmentedProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string }[];
}

/** Design-system modern tabs used as a segmented control; the page content below is rendered by the caller. */
const Segmented = <T extends string>({ value, onChange, options }: SegmentedProps<T>) => (
    <Tabs
        variant="modern"
        contained
        className="shrink-0"
        value={Math.max(
            0,
            options.findIndex((option) => option.value === value)
        )}
        onChange={(index) => onChange(options[index].value)}
        tabs={options.map((option) => ({ title: option.label }))}
    />
);

export const CustomizePageHeader = ({
    activeTab,
    onTabChange,
    skillsView,
    onSkillsViewChange,
    searchQuery,
    onSearchQueryChange,
    onCreateSkill,
    onUploadSkill,
}: CustomizePageHeaderProps) => {
    const searchPlaceholder = (() => {
        if (activeTab === 'connectors') {
            return c('collider_2025:Placeholder').t`Search connectors`;
        }
        return skillsView === 'discover'
            ? c('collider_2025:Placeholder').t`Search ready-made skills`
            : c('collider_2025:Placeholder').t`Search your skills`;
    })();

    return (
        <header className="flex flex-column flex-nowrap gap-5 mb-6">
            <h1 className="text-3xl text-bold m-0">{c('collider_2025:Title').t`Customize`}</h1>
            <div className="flex flex-nowrap items-center gap-3 w-full">
                <Segmented
                    value={activeTab}
                    onChange={onTabChange}
                    options={[
                        { value: 'skills', label: c('collider_2025:Tab').t`Skills` },
                        { value: 'connectors', label: c('collider_2025:Tab').t`Connectors` },
                    ]}
                />
                {activeTab === 'skills' && (
                    <>
                        <Vr aria-hidden="true" className="h-custom shrink-0" style={{ '--h-custom': '1.5rem' }} />
                        <Segmented
                            value={skillsView}
                            onChange={onSkillsViewChange}
                            options={[
                                { value: 'yours', label: c('collider_2025:Tab').t`Yours` },
                                { value: 'discover', label: c('collider_2025:Tab').t`Discover` },
                            ]}
                        />
                    </>
                )}
                <div className="flex-1 min-w-4" />
                <div className="w-custom shrink-0" style={{ '--w-custom': '16.25rem' }}>
                    <Input
                        value={searchQuery}
                        onValue={onSearchQueryChange}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
                    />
                </div>
                {activeTab === 'skills' && <AddSkillMenu onCreate={onCreateSkill} onUpload={onUploadSkill} />}
            </div>
            <hr className="m-0 border-top border-weak" />
        </header>
    );
};
