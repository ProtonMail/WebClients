import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isLinux, isMac } from '@proton/shared/lib/helpers/browser';
import chatgptLogo from '@proton/styles/assets/img/lumo/trail/chatgpt.svg';
import claudeLogo from '@proton/styles/assets/img/lumo/trail/claude.svg';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './MoveSkillsModal.scss';

const Strong = ({ children }: { children: ReactNode }) => <strong className="text-semibold">{children}</strong>;
const Path = ({ children }: { children: string }) => <code className="move-skills__path">{children}</code>;

const Steps = ({ steps }: { steps: ReactNode[] }) => (
    <ol className="unstyled m-0 flex flex-column flex-nowrap gap-2">
        {steps.map((step, index) => (
            // Steps are a fixed list, so the index is a stable key.
            // eslint-disable-next-line react/no-array-index-key
            <li key={index} className="flex flex-nowrap items-start gap-2 text-sm">
                <span className="move-skills__step-index flex shrink-0 items-center justify-center text-xs text-semibold">
                    {index + 1}
                </span>
                <span className="flex-1 min-w-0">{step}</span>
            </li>
        ))}
    </ol>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="flex flex-column flex-nowrap gap-2">
        <h3 className="m-0 text-sm text-semibold">{title}</h3>
        {children}
    </section>
);

/** Shortcut that shows hidden (dot) folders in the system folder picker, where there is one. */
const getHiddenFoldersHint = () => {
    if (isMac()) {
        const shortcut = <kbd key="shortcut">⌘ ⇧ .</kbd>;
        return c('collider_2025:Info')
            .jt`Can't see the folder? It's hidden. In the folder picker, press ${shortcut} to show hidden folders.`;
    }
    if (isLinux()) {
        const shortcut = <kbd key="shortcut">Ctrl H</kbd>;
        return c('collider_2025:Info')
            .jt`Can't see the folder? It's hidden. In the folder picker, press ${shortcut} to show hidden folders.`;
    }
    return undefined;
};

/** Code tools keep skills on disk, so this path picks a folder rather than downloaded files. */
const SkillsFolderSection = ({
    title,
    description,
    onChooseFolder,
}: {
    title: string;
    description: ReactNode;
    onChooseFolder: () => void;
}) => {
    const hiddenFoldersHint = getHiddenFoldersHint();
    return (
        <Section title={title}>
            <p className="m-0 text-sm">{description}</p>
            <p className="m-0 text-sm">
                {c('collider_2025:Info')
                    .t`Choose that folder to add every skill in it, or one skill's folder to add just that one.`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <Button size="small" shape="outline" onClick={onChooseFolder}>
                    {c('collider_2025:Action').t`Choose a folder`}
                </Button>
            </div>
            {hiddenFoldersHint && (
                <p className="move-skills__hint m-0 flex flex-nowrap items-start gap-2 text-xs color-weak">
                    <LumoIcon aria-hidden name="Lightbulb" size={14} className="shrink-0 mt-0.5" />
                    <span>{hiddenFoldersHint}</span>
                </p>
            )}
        </Section>
    );
};

interface InstructionsProps {
    onChooseFolder: () => void;
}

const ClaudeInstructions = ({ onChooseFolder }: InstructionsProps) => {
    const customizeSkills = <Strong key="customize">{c('collider_2025:Info').t`Customize › Skills`}</Strong>;
    const more = <Strong key="more">···</Strong>;
    const download = <Strong key="download">{c('collider_2025:Info').t`Download`}</Strong>;
    const chooseFiles = <Strong key="choose-files">{c('collider_2025:Action').t`Choose files`}</Strong>;
    const path = <Path key="path">~/.claude/skills</Path>;

    return (
        <>
            <Section title={c('collider_2025:Title').t`Claude on the web or desktop`}>
                <Steps
                    steps={[
                        c('collider_2025:Info').jt`In Claude, go to ${customizeSkills}.`,
                        c('collider_2025:Info')
                            .jt`Open a skill you made, click ${more} and choose ${download}. You get a .zip file.`,
                        c('collider_2025:Info')
                            .jt`Back in ${LUMO_SHORT_APP_NAME}, drop the .zip on this page or click ${chooseFiles}.`,
                    ]}
                />
            </Section>
            <SkillsFolderSection
                title="Claude Code"
                description={c('collider_2025:Info').jt`Your skills are folders in ${path}.`}
                onChooseFolder={onChooseFolder}
            />
        </>
    );
};

const ChatGptInstructions = ({ onChooseFolder }: InstructionsProps) => {
    const skills = <Strong key="skills">{c('collider_2025:Info').t`Skills`}</Strong>;
    const more = <Strong key="more">···</Strong>;
    const download = <Strong key="download">{c('collider_2025:Info').t`Download`}</Strong>;
    const chooseFiles = <Strong key="choose-files">{c('collider_2025:Action').t`Choose files`}</Strong>;
    const path = <Path key="path">~/.agents/skills</Path>;
    const legacyPath = <Path key="legacy-path">~/.codex/skills</Path>;

    return (
        <>
            <Section title="ChatGPT">
                <Steps
                    steps={[
                        c('collider_2025:Info').jt`In ChatGPT, open ${skills} in the sidebar.`,
                        c('collider_2025:Info').jt`Open a skill you made, click ${more} and choose ${download}.`,
                        c('collider_2025:Info')
                            .jt`Back in ${LUMO_SHORT_APP_NAME}, drop the file on this page or click ${chooseFiles}.`,
                    ]}
                />
            </Section>
            <SkillsFolderSection
                title="Codex"
                description={c('collider_2025:Info')
                    .jt`Your skills are folders in ${path} (older setups use ${legacyPath}).`}
                onChooseFolder={onChooseFolder}
            />
        </>
    );
};

const SOURCES = ['claude', 'chatgpt'] as const;

interface MoveSkillsModalProps extends ModalStateProps {
    onChooseFiles: () => void;
    onChooseFolder: () => void;
}

/** Step-by-step help for bringing skills made in Claude or ChatGPT into Lumo. */
export const MoveSkillsModal = ({ onChooseFiles, onChooseFolder, ...modalProps }: MoveSkillsModalProps) => {
    const [source, setSource] = useState<(typeof SOURCES)[number]>('claude');
    const chooseFolder = () => {
        modalProps.onClose?.();
        onChooseFolder();
    };

    return (
        <ModalTwo {...modalProps} size="medium">
            <ModalTwoHeader title={c('collider_2025:Title').t`Move your skills to ${LUMO_SHORT_APP_NAME}`} />
            <ModalTwoContent className="flex flex-column flex-nowrap gap-4">
                <p className="m-0 text-sm color-weak">
                    {c('collider_2025:Info')
                        .t`Claude and ChatGPT use the same skill format as ${LUMO_SHORT_APP_NAME}: a folder with a SKILL.md file. Download your skills there, then add them here.`}
                </p>
                <div className="flex">
                    <Tabs
                        variant="modern"
                        contained
                        value={SOURCES.indexOf(source)}
                        onChange={(index) => setSource(SOURCES[index])}
                        tabs={[
                            {
                                title: 'Claude',
                                icon: <img src={claudeLogo} alt="" width={14} height={14} />,
                                iconPosition: 'leading',
                            },
                            {
                                title: 'ChatGPT',
                                icon: <img src={chatgptLogo} alt="" width={14} height={14} />,
                                iconPosition: 'leading',
                            },
                        ]}
                    />
                </div>
                {source === 'claude' ? (
                    <ClaudeInstructions onChooseFolder={chooseFolder} />
                ) : (
                    <ChatGptInstructions onChooseFolder={chooseFolder} />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Close`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        modalProps.onClose?.();
                        onChooseFiles();
                    }}
                >
                    {c('collider_2025:Action').t`Choose files`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
