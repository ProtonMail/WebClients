import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import { BRAND_NAME, LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { CreateFreeAccountButton } from '../../../components/Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../../../components/Guest/SignInLink';
import { type ProtonPlugin, getProtonPlugins } from '../../skills/protonCatalog';
import type { CustomizeTab } from '../customizeTabs';
import { CustomizeNotice } from './CustomizeNotice';
import { CustomizeTabs } from './CustomizePageHeader';
import { DesktopConnectorsNotice, getConnectorsSellingPoints } from './DesktopConnectorsNotice';
import { PluginIcon, getPluginMeta } from './ProtonPluginCard';
import { ProtonPluginPreviewModal } from './ProtonPluginPreviewModal';
import './CustomizeGuestView.scss';

/** Skill sets previewed to guests, with a shorter summary than the catalog description. */
const getPreviewedSkillSets = (): Record<string, () => string> => ({
    'proton-plugin-writing': () =>
        c('collider_2025:Plugin summary').t`Draft, edit and translate in your own voice.`,
    'proton-plugin-research': () => c('collider_2025:Plugin summary').t`Sourced reports and fact-checks.`,
    'proton-plugin-data': () => c('collider_2025:Plugin summary').t`Clean spreadsheets, charts and dashboards.`,
    'proton-plugin-productivity': () =>
        c('collider_2025:Plugin summary').t`Meetings and inboxes into plans and replies.`,
    'proton-plugin-presentations': () => c('collider_2025:Plugin summary').t`Slide decks, one-pagers and explainers.`,
    'proton-plugin-privacy': () => c('collider_2025:Plugin summary').t`Spot phishing, redact data, read policies.`,
});

const AuthActions = () => (
    <>
        <CreateFreeAccountButton color="norm" shape="solid" />
        <SignInButton color="weak" shape="outline" />
    </>
);

const GuestSkills = () => {
    const plugins = getProtonPlugins();
    const previews = getPreviewedSkillSets();
    const previewed = plugins.filter((plugin) => plugin.id in previews);
    const moreCount = plugins.length - previewed.length;
    const previewModal = useModalStateObject();
    const [selected, setSelected] = useState<ProtonPlugin>();

    return (
        <div className="flex flex-column flex-nowrap gap-6">
            <CustomizeNotice
                title={c('collider_2025:Title').t`Teach ${LUMO_SHORT_APP_NAME} how you work`}
                description={c('collider_2025:Info')
                    .t`Skills are saved instructions for tasks you do often. Type / in any chat to use one.`}
                points={[
                    {
                        icon: 'WandSparkles',
                        text: c('collider_2025:Info')
                            .t`Describe a task and ${LUMO_SHORT_APP_NAME} drafts the skill for you`,
                    },
                    {
                        icon: 'Blocks',
                        text: c('collider_2025:Info')
                            .t`Start from ${BRAND_NAME}'s skills, or upload your own, including Claude plugins`,
                    },
                    { icon: 'Lock', text: c('collider_2025:Info').t`Your information is zero-access encrypted` },
                ]}
                actions={<AuthActions />}
            />

            <section className="flex flex-column flex-nowrap gap-4" aria-labelledby="customize-guest-skills">
                <div className="flex flex-column flex-nowrap gap-1">
                    <h2 id="customize-guest-skills" className="m-0 text-rg text-semibold">
                        {c('collider_2025:Title').t`Skills from ${BRAND_NAME}`}
                    </h2>
                    <p className="m-0 text-xs color-weak">
                        {moreCount > 0
                            ? c('collider_2025:Info').ngettext(
                                  msgid`Ready-made skills for common tasks. ${moreCount} more once you sign in.`,
                                  `Ready-made skills for common tasks. ${moreCount} more once you sign in.`,
                                  moreCount
                              )
                            : c('collider_2025:Info').t`Ready-made skills for common tasks.`}
                    </p>
                </div>
                <ul className="customize-guest__sets unstyled m-0">
                    {previewed.map((plugin, index) => {
                        const getSummary = previews[plugin.id];
                        return (
                            <li key={plugin.id} style={{ '--index': index }}>
                                <Card
                                    as="article"
                                    background={false}
                                    padded={false}
                                    className="customize-guest__set relative flex flex-nowrap items-start gap-3 h-full rounded-lg bg-norm"
                                >
                                    <PluginIcon plugin={plugin} size="small" />
                                    <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                                        <h3 className="m-0 text-sm text-semibold text-ellipsis">
                                            <button
                                                type="button"
                                                className="expand-click-area text-left"
                                                onClick={() => {
                                                    setSelected(plugin);
                                                    previewModal.openModal(true);
                                                }}
                                            >
                                                {plugin.getTitle()}
                                            </button>
                                        </h3>
                                        <p className="m-0 text-xs color-weak text-ellipsis">{getSummary()}</p>
                                        <span className="mt-0.5 text-xs color-hint">{getPluginMeta(plugin)}</span>
                                    </div>
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            </section>
            {previewModal.render && selected && (
                <ProtonPluginPreviewModal
                    {...previewModal.modalProps}
                    plugin={selected}
                    primaryAction={<CreateFreeAccountButton color="norm" shape="solid" />}
                />
            )}
        </div>
    );
};

const GuestConnectors = () => {
    if (!isDesktopEnvironment()) {
        return <DesktopConnectorsNotice />;
    }
    return (
        <CustomizeNotice
            title={c('collider_2025:Title').t`Sign in to connect your apps`}
            description={c('collider_2025:Info')
                .t`Connect ${MAIL_APP_NAME}, your files, Jira, Linear and more, so ${LUMO_SHORT_APP_NAME} can work with the things you already use.`}
            points={getConnectorsSellingPoints()}
            actions={<AuthActions />}
        />
    );
};

interface CustomizeGuestViewProps {
    activeTab: CustomizeTab;
    onTabChange: (tab: CustomizeTab) => void;
}

/** Customize for signed-out users: one card per tab explaining the feature, with sign-up actions. */
export const CustomizeGuestView = ({ activeTab, onTabChange }: CustomizeGuestViewProps) => (
    <>
        <header className="flex flex-column flex-nowrap gap-5 mb-6">
            <h1 className="text-3xl text-bold m-0">{c('collider_2025:Title').t`Customize`}</h1>
            <div className="flex">
                <CustomizeTabs value={activeTab} onChange={onTabChange} />
            </div>
            <hr className="m-0 border-top border-weak" />
        </header>
        {activeTab === 'skills' ? <GuestSkills /> : <GuestConnectors />}
    </>
);
