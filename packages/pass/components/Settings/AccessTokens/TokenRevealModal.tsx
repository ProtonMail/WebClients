import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { AGENT_INSTRUCTIONS_URL } from '@proton/pass/constants.runtime';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getAgentInstructions } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';

type Props = {
    /** Full env-var value: `<server-issued-token>::<urlsafe-base64-no-pad(raw-key)>`.
     * The raw key portion never leaves the client after this modal is closed. */
    envVar: string;
    /** When true, render markdown tailored for pasting into an AI agent. */
    agent: boolean;
    onClose: () => void;
};

const PASS_CLI_HOME = 'https://protonpass.github.io/pass-cli/';

/** Placeholder used by the CDN markdown which we will replace. */
const ACCESS_TOKEN_PLACEHOLDER = '{{access_token}}';

const CodeBlock: FC<{ value: string; onCopy: (v: string) => void }> = ({ value, onCopy }) => (
    <div className="flex items-center gap-2 p-3 mt-2 rounded border border-weak bg-weak">
        <code className="text-monospace text-break flex-1 text-sm">{value}</code>
        <Button size="small" shape="outline" onClick={() => onCopy(value)}>
            {c('Action').t`Copy`}
        </Button>
    </div>
);

const AgentInstructions: FC<{ envVar: string; copy: (v: string) => void }> = ({ envVar, copy }) => {
    const [template, setTemplate] = useState<MaybeNull<string>>(null);
    const fetchInstructions = useRequest(getAgentInstructions, { loading: true, onSuccess: setTemplate });
    const markdown = useMemo(
        () => (template ? template.replaceAll(ACCESS_TOKEN_PLACEHOLDER, envVar) : null),
        [template]
    );

    useEffect(() => fetchInstructions.dispatch(), []);

    if (markdown) {
        return (
            <>
                <p className="color-weak mt-0">
                    {c('Info')
                        .t`Copy the markdown below and send it to your AI agent. This is the only time the token will be shown.`}
                </p>
                <pre
                    className="p-3 mt-2 rounded border border-weak bg-weak text-monospace text-sm overflow-auto m-0 max-h-custom"
                    style={{ '--max-h-custom': '22rem' }}
                >
                    {markdown}
                </pre>
                <Button color="norm" onClick={() => copy(markdown)} className="mt-3">
                    {c('Action').t`Copy instructions`}
                </Button>
            </>
        );
    }

    if (fetchInstructions.loading) {
        return (
            <div className="flex justify-center py-6">
                <CircleLoader size="medium" />
            </div>
        );
    }

    const url = (
        <Href key="agent-instructions-link" href={AGENT_INSTRUCTIONS_URL}>
            {AGENT_INSTRUCTIONS_URL}
        </Href>
    );

    return (
        <>
            <p className="color-weak mt-0">
                {c('Error')
                    .t`Couldn't load agent setup instructions. Please copy the token below, it won't be shown again.`}
            </p>
            <CodeBlock value={envVar} onCopy={copy} />
            <p className="color-weak mt-3">{c('Info')
                .jt`Then you can go to ${url} to copy the instructions to send to your AI agent.`}</p>
        </>
    );
};

export const TokenRevealModal: FC<Props> = ({ envVar, agent, onClose }) => {
    const copyToClipboard = useCopyToClipboard();
    const copy = (value: string) => {
        void copyToClipboard(value);
    };

    if (agent) {
        return (
            <PassModal open onClose={onClose} onReset={onClose} size="xlarge">
                <ModalTwoHeader title={c('Title').t`Agent setup instructions`} />
                <ModalTwoContent>
                    <AgentInstructions envVar={envVar} copy={copy} />
                </ModalTwoContent>
                <ModalTwoFooter />
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
        <PassModal open onClose={onClose} onReset={onClose} size="large">
            <ModalTwoHeader title={c('Title').t`Your new access token`} />
            <ModalTwoContent>
                <p className="color-weak mt-0">
                    {c('Info').t`Copy this token now. For security reasons, it won't be shown again.`}
                </p>
                <CodeBlock value={envVar} onCopy={copy} />

                <ol className="mt-4 pl-4 flex flex-column gap-3">
                    <li>{c('Info').jt`Download pass-cli from ${passCliLink}.`}</li>
                    <li>
                        {c('Info').t`Log out of any existing session:`}
                        <CodeBlock value="pass-cli logout" onCopy={copy} />
                    </li>
                    <li>
                        {c('Info').t`Test the token by logging in and listing vaults:`}
                        <CodeBlock value={loginCmd} onCopy={copy} />
                    </li>
                </ol>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" onClick={() => copy(envVar)}>
                    {c('Action').t`Copy token`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
