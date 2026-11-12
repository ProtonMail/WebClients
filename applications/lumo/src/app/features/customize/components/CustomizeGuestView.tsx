import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Card } from '@proton/atoms/Card/Card';
import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { CreateFreeAccountButton } from '../../../components/Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../../../components/Guest/SignInLink';
import { type IconName, LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { getProtonPlugins } from '../../skills/protonCatalog';
import { CONNECTORS_LEARN_MORE_URL, DESKTOP_DOWNLOAD_URL } from './DesktopConnectorsNotice';
import { PluginExample, PluginIcon, getPluginMeta } from './ProtonPluginCard';
import lumoAppIcon from './lumo-app-icon.png';

import './CustomizeGuestView.scss';

const PREVIEWED_SKILL_SETS = 6;

const Feature = ({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) => (
    <Card background={false} className="flex flex-column flex-nowrap gap-3 rounded-xl p-5">
        <span className="customize-guest__feature-icon flex items-center justify-center rounded-lg" aria-hidden>
            <LumoIcon name={icon} size={20} />
        </span>
        <h3 className="m-0 text-lg text-semibold">{title}</h3>
        <p className="m-0 color-weak">{children}</p>
    </Card>
);

const Step = ({ index, title, description }: { index: number; title: string; description: string }) => (
    <li className="flex flex-nowrap items-start gap-3">
        <span className="customize-guest__step-index flex shrink-0 items-center justify-center text-sm text-semibold">
            {index}
        </span>
        <div className="flex flex-column flex-nowrap gap-0.5">
            <span className="text-semibold">{title}</span>
            <span className="text-sm color-weak">{description}</span>
        </div>
    </li>
);

/** Customize for signed-out users: explains skills, skill sets and connectors, and asks them to sign up. */
export const CustomizeGuestView = () => {
    const plugins = getProtonPlugins();
    const previewed = plugins.slice(0, PREVIEWED_SKILL_SETS);
    const moreCount = plugins.length - previewed.length;
    const isDesktop = isDesktopEnvironment();
    const connectorExamples: { icon: IconName; label: string }[] = [
        { icon: 'FolderOpen', label: c('collider_2025:Label').t`Files` },
        { icon: 'Mail', label: MAIL_APP_NAME },
        { icon: 'Globe', label: c('collider_2025:Label').t`Browser` },
        { icon: 'Blocks', label: c('collider_2025:Label').t`And more` },
    ];

    return (
        <div className="flex flex-column flex-nowrap gap-10">
            <header className="customize-guest__hero flex flex-column flex-nowrap items-start gap-4 border rounded-xl p-8">
                <span className="customize-guest__eyebrow flex items-center gap-1 text-sm text-semibold">
                    <LumoIcon name="WandSparkles" size={14} />
                    {c('collider_2025:Title').t`Customize`}
                </span>
                <h1 className="m-0 text-4xl text-bold">
                    {c('collider_2025:Title').t`Make ${LUMO_SHORT_APP_NAME} work your way`}
                </h1>
                <p className="m-0 text-lg color-weak max-w-custom" style={{ '--max-w-custom': '40rem' }}>
                    {c('collider_2025:Info')
                        .t`Teach ${LUMO_SHORT_APP_NAME} the tasks you do often with skills, and let it work with your files and apps through connectors. Create a free account to get started.`}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <CreateFreeAccountButton color="norm" shape="solid" />
                    <SignInButton color="weak" shape="outline" />
                </div>
            </header>

            <section className="flex flex-column flex-nowrap gap-4" aria-labelledby="customize-guest-features">
                <h2 id="customize-guest-features" className="m-0 text-xl text-semibold">
                    {c('collider_2025:Title').t`What you can do`}
                </h2>
                <div className="customize-guest__features">
                    <Feature icon="ScrollText" title={c('collider_2025:Title').t`Skills`}>
                        {c('collider_2025:Info')
                            .t`A skill is a set of instructions that teaches ${LUMO_SHORT_APP_NAME} how you like a task done, like meeting notes, code reviews or replies in your tone. Type / in any chat to use one.`}
                    </Feature>
                    <Feature icon="Package" title={c('collider_2025:Title').t`Skill sets`}>
                        {c('collider_2025:Info')
                            .t`Ready-made bundles of skills for writing, research, data and more. Add a whole set at once, or upload your own, including Claude plugins.`}
                    </Feature>
                    <Feature icon="Blocks" title={c('collider_2025:Title').t`Connectors`}>
                        {c('collider_2025:Info')
                            .t`In the desktop app, connectors let ${LUMO_SHORT_APP_NAME} answer using your files, ${MAIL_APP_NAME}, the web and more, and you choose exactly what each one can access.`}
                    </Feature>
                </div>
            </section>

            <section
                className="customize-guest__how flex flex-nowrap gap-8 rounded-xl p-6"
                aria-labelledby="customize-guest-how"
            >
                <div className="flex flex-column flex-nowrap gap-2 flex-1 min-w-0">
                    <h2 id="customize-guest-how" className="m-0 text-xl text-semibold">
                        {c('collider_2025:Title').t`Your first skill takes a minute`}
                    </h2>
                    <p className="m-0 color-weak">
                        {c('collider_2025:Info')
                            .t`No need to write it yourself. Say what you want and ${LUMO_SHORT_APP_NAME} drafts the skill for you.`}
                    </p>
                </div>
                <ol className="unstyled m-0 flex flex-column flex-nowrap gap-4 flex-1 min-w-0">
                    <Step
                        index={1}
                        title={c('collider_2025:Title').t`Describe it`}
                        description={c('collider_2025:Info').t`“Summarize meeting notes into decisions and actions.”`}
                    />
                    <Step
                        index={2}
                        title={c('collider_2025:Title').t`Review the draft`}
                        description={c('collider_2025:Info')
                            .t`${LUMO_SHORT_APP_NAME} writes the instructions. Edit anything, or ask it to refine.`}
                    />
                    <Step
                        index={3}
                        title={c('collider_2025:Title').t`Use it in any chat`}
                        description={c('collider_2025:Info').t`Type /meeting-notes and paste your notes.`}
                    />
                </ol>
            </section>

            <section className="flex flex-column flex-nowrap gap-4" aria-labelledby="customize-guest-sets">
                <div className="flex flex-column flex-nowrap gap-1">
                    <h2 id="customize-guest-sets" className="m-0 text-xl text-semibold">
                        {c('collider_2025:Title').t`Skill sets to start with`}
                    </h2>
                    {moreCount > 0 && (
                        <p className="m-0 color-weak">
                            {c('collider_2025:Info').ngettext(
                                msgid`And ${moreCount} more skill set to browse once you sign in.`,
                                `And ${moreCount} more skill sets to browse once you sign in.`,
                                moreCount
                            )}
                        </p>
                    )}
                </div>
                <ul className="customize-guest__sets unstyled m-0">
                    {previewed.map((plugin) => (
                        <li key={plugin.id}>
                            <Card
                                as="article"
                                background={false}
                                className="flex flex-column flex-nowrap gap-4 h-full rounded-xl p-5"
                            >
                                <div className="flex flex-nowrap items-start gap-3 min-w-0">
                                    <PluginIcon plugin={plugin} />
                                    <div className="flex flex-column flex-nowrap flex-1 min-w-0 gap-0.5">
                                        <h3 className="m-0 text-semibold text-ellipsis">{plugin.getTitle()}</h3>
                                        <span className="text-sm color-weak">{getPluginMeta(plugin)}</span>
                                    </div>
                                </div>
                                <p className="m-0 text-sm text-ellipsis-two-lines">{plugin.getDescription()}</p>
                                <div className="mt-auto">
                                    <PluginExample plugin={plugin} />
                                </div>
                            </Card>
                        </li>
                    ))}
                </ul>
            </section>

            <section
                className="customize-guest__desktop flex flex-nowrap items-center gap-6 border rounded-xl p-6"
                aria-labelledby="customize-guest-desktop"
            >
                <img className="customize-guest__app-icon shrink-0" src={lumoAppIcon} alt="" width={72} height={72} />
                <div className="flex flex-column flex-nowrap gap-2 flex-1 min-w-0">
                    <h2 id="customize-guest-desktop" className="m-0 text-xl text-semibold">
                        {isDesktop
                            ? c('collider_2025:Title').t`Sign in to connect your apps`
                            : c('collider_2025:Title').t`Connect ${LUMO_SHORT_APP_NAME} to the tools you use`}
                    </h2>
                    <p className="m-0 color-weak">
                        {c('collider_2025:Info')
                            .t`Connect ${LUMO_SHORT_APP_NAME} to your files, ${MAIL_APP_NAME}, your browser and more, so it has the context to draft, summarize and plan around your real work instead of starting from scratch. You choose what each connector can access.`}
                    </p>
                    <ul className="unstyled m-0 flex flex-wrap gap-2" aria-label={c('collider_2025:Label').t`Examples`}>
                        {connectorExamples.map(({ icon, label }) => (
                            <li
                                key={label}
                                className="customize-guest__chip flex flex-nowrap items-center gap-1 text-sm rounded-full px-3 py-1"
                            >
                                <LumoIcon aria-hidden name={icon} size={14} />
                                {label}
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {!isDesktop && (
                            <ButtonLike
                                as="a"
                                color="weak"
                                shape="outline"
                                href={DESKTOP_DOWNLOAD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <LumoIcon aria-hidden name="Download" size={16} className="mr-2" />
                                {c('collider_2025:Action').t`Get the desktop app`}
                            </ButtonLike>
                        )}
                        <ButtonLike
                            as="a"
                            shape="ghost"
                            color="weak"
                            href={CONNECTORS_LEARN_MORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {c('collider_2025:Action').t`Learn more about connectors`}
                        </ButtonLike>
                    </div>
                </div>
            </section>

            <footer className="customize-guest__cta flex flex-nowrap items-center gap-6 border rounded-xl p-8">
                <span className="customize-guest__cta-icon flex shrink-0 items-center justify-center" aria-hidden>
                    <LumoIcon name="WandSparkles" size={28} />
                </span>
                <div className="flex flex-column flex-nowrap gap-1 flex-1 min-w-0">
                    <h2 className="m-0 text-xl text-semibold">
                        {c('collider_2025:Title').t`Ready to make your first skill?`}
                    </h2>
                    <p className="m-0 color-weak">
                        {c('collider_2025:Info')
                            .t`Create a free account to save skills, add skill sets and use them in every chat.`}
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm color-weak">
                        <LumoIcon aria-hidden name="Lock" size={12} className="mr-1" />
                        {c('collider_2025:Info').t`Your information is zero-access encrypted`}
                    </p>
                </div>
                <div className="customize-guest__cta-actions flex flex-nowrap items-center gap-2 shrink-0">
                    <SignInButton color="weak" shape="outline" />
                    <CreateFreeAccountButton color="norm" shape="solid" />
                </div>
            </footer>
        </div>
    );
};
