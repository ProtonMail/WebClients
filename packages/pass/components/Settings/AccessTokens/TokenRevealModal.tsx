import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

type Props = {
    /** Full env-var value: `<server-issued-token>::<urlsafe-base64-no-pad(raw-key)>`.
     * The raw key portion never leaves the client after this modal is closed. */
    envVar: string;
    /** When true, render markdown tailored for pasting into an AI agent. */
    agent: boolean;
    onClose: () => void;
};

const PASS_CLI_HOME = 'https://protonpass.github.io/pass-cli/';

const buildAgentMarkdown = (envVar: string) => `# Proton Pass agent setup

1. Download and install **pass-cli** from ${PASS_CLI_HOME}.

2. Use the personal access token below to authenticate. Keep it secret — it will not be shown again:

   \`\`\`
   ${envVar}
   \`\`\`

3. Run the following command to log in and list accessible vaults:

   \`\`\`sh
   PROTON_PASS_PERSONAL_ACCESS_TOKEN=${envVar} pass-cli login && pass-cli vault list
   \`\`\`

4. Refer to the documentation at ${PASS_CLI_HOME} for the full command reference.
`;

const CodeBlock: FC<{ value: string; onCopy: (v: string) => void }> = ({ value, onCopy }) => (
    <div className="flex items-center gap-2 p-3 mt-2 rounded border border-weak bg-weak">
        <code className="text-monospace text-break flex-1 text-sm">{value}</code>
        <Button size="small" shape="outline" onClick={() => onCopy(value)}>
            {c('Action').t`Copy`}
        </Button>
    </div>
);

export const TokenRevealModal: FC<Props> = ({ envVar, agent, onClose }) => {
    const copyToClipboard = useCopyToClipboard();
    const copy = (value: string) => {
        void copyToClipboard(value);
    };

    if (agent) {
        const markdown = buildAgentMarkdown(envVar);
        return (
            <PassModal open onClose={onClose} onReset={onClose} size="large">
                <ModalTwoHeader title={c('pass_2026: Title').t`Agent setup instructions`} />
                <ModalTwoContent>
                    <p className="color-weak mt-0">
                        {c('pass_2026: Info')
                            .t`Copy the markdown below and send it to your AI agent. This is the only time the token will be shown.`}
                    </p>
                    <pre
                        className="p-3 mt-2 rounded border border-weak bg-weak text-monospace text-sm overflow-auto m-0"
                        style={{ maxHeight: '22rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                    >
                        {markdown}
                    </pre>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                    <Button color="norm" onClick={() => copy(markdown)}>
                        {c('pass_2026: Action').t`Copy instructions`}
                    </Button>
                </ModalTwoFooter>
            </PassModal>
        );
    }

    const loginCmd = `PROTON_PASS_PERSONAL_ACCESS_TOKEN=${envVar} pass-cli login && pass-cli vault list`;
    const passCliLink = (
        <Href key="pass-cli-link" href={PASS_CLI_HOME}>
            {PASS_CLI_HOME}
        </Href>
    );

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="medium">
            <ModalTwoHeader title={c('pass_2026: Title').t`Your new access token`} />
            <ModalTwoContent>
                <p className="color-weak mt-0">
                    {c('pass_2026: Info').t`Copy this token now. For security reasons, it won't be shown again.`}
                </p>
                <CodeBlock value={envVar} onCopy={copy} />

                <ol className="mt-4 pl-4 flex flex-column gap-3">
                    <li>{c('pass_2026: Info').jt`Download pass-cli from ${passCliLink}.`}</li>
                    <li>
                        {c('pass_2026: Info').t`Log out of any existing session:`}
                        <CodeBlock value="pass-cli logout" onCopy={copy} />
                    </li>
                    <li>
                        {c('pass_2026: Info').t`Test the token by logging in and listing vaults:`}
                        <CodeBlock value={loginCmd} onCopy={copy} />
                    </li>
                </ol>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={() => copy(envVar)}>
                    {c('pass_2026: Action').t`Copy token`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
