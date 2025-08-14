import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, NotificationDot, Pill } from '@proton/atoms';
import { ThemeColor } from '@proton/colors/types';
import type { ModalProps } from '@proton/components';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import generatingLoader from '@proton/styles/assets/img/illustrations/lumo-dot-loader.svg';

import { callLumoAssistant } from '../../../lib/lumo-api-client';
import { appendFinalTurn } from '../../../llm';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAllUserMessages } from '../../../redux/selectors';
import { Role } from '../../../types';
import type { GenerationToFrontendMessage } from '../../../types-api';
import { listify } from '../../../util/collections';
import { LumoSidebarButton as SidebarButton } from '../../components/LumoSidebarButton';
import { DOT_COLOR, MAXIMUM_PROMPTS, MINIMUM_REQUIRED_PROMPTS, extractAndParseJson, truncateContent } from './helpers';

import './WhatDoesLlmKnowModal.scss';

const WHAT_LLM_KNOWS_SYSTEM_TURN = {
    role: Role.System,
    content:
        "try to guess a profile of the user, given prompts of this user's conversations. Provide a response in valid JSON format with keys 'Location', 'Gender', 'Age', 'Occupation', 'Interests', 'Education', 'Health', 'Relationship_Status', 'Voting_Preference', 'Other'; where each sub-object has keys 'value', 'certainty' (null, possibly, likely, certain) and optionally 'rationale' (excluded if unsure). Do not include additional text outside the JSON",
    context: undefined,
};

type WhatLlmKnowsValue = string | string[] | { [key: string]: string };
type WhatLlmKnowsData = {
    value: WhatLlmKnowsValue;
    certainty?: string;
    rationale?: string;
};

type WhatLlmKnowsResponse = {
    Location: WhatLlmKnowsData;
    Age: WhatLlmKnowsData;
    Gender: WhatLlmKnowsData;
    Occupation: WhatLlmKnowsData;
    Education: WhatLlmKnowsData;
    Voting_Preference: WhatLlmKnowsData;
    Relationship_Status: WhatLlmKnowsData;
    Health: WhatLlmKnowsData;
    Interests: WhatLlmKnowsData;
    Other: WhatLlmKnowsData;
};

interface WhatDoesLLMKnowProps {
    loading: boolean;
    data?: WhatLlmKnowsResponse;
}

const WhatLlmKnowsValues = ({ value }: { value: WhatLlmKnowsValue | undefined }) => {
    if (!value) {
        return (
            <Pill className="rounded-md" color="#a7a4b5" backgroundColor="#292733">{c('collider_2025: Pill')
                .t`Unknown`}</Pill>
        );
    }

    if (typeof value === 'string') {
        return (
            <Pill className="rounded-md" color="#a7a4b5" backgroundColor="#292733">
                {value || c('collider_2025: Pill').t`Unknown`}
            </Pill>
        );
    }

    if (Array.isArray(value)) {
        return (
            <>
                {value.map((val) => (
                    <Pill key={val} className="rounded-md" color="#a7a4b5" backgroundColor="#292733">
                        {val || c('collider_2025: Pill').t`Unknown`}
                    </Pill>
                ))}
            </>
        );
    }

    if (typeof value === 'object' && value !== null) {
        return (
            <div className="flex flex-column flex-nowrap gap-0.5">
                {Object.entries(value).map(([label, info]) => (
                    <div className="flex flex-row flex-nowrap gap-2" key={label}>
                        <span>{label}</span>
                        <Pill key={`${label}.${info}`} className="rounded-md" color="#a7a4b5" backgroundColor="#292733">
                            {info || c('collider_2025: Pill').t`Unknown`}
                        </Pill>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

interface WhatDoesLlmKnowDisclaimerModalProps {
    onClick: () => void;
}
const WhatDoesLlmKnowDisclaimerModal = ({
    onClick,
    ...modalProps
}: WhatDoesLlmKnowDisclaimerModalProps & ModalProps) => {
    return (
        <>
            <ModalTwo {...modalProps}>
                <ModalTwoHeader
                    titleClassName="text-center"
                    title={c('collider_2025:Title').t`What can other AI chat systems really know about you?`}
                />
                <ModalTwoContent className="flex flex-column flex-nowrap gap-2">
                    <p className="m-0">{c('collider_2025:Info')
                        .t`AI chat systems know more than you think. They collect and analyze your data, such as your conversation history, writing style, communication habits, interaction details, topics you care about, and language preferences.`}</p>
                    <p className="m-0">{c('collider_2025:Info')
                        .t`While they may not know personal identifiers like your real name or address, they build a sophisticated profile of your digital interaction behaviours.`}</p>
                    <p className="m-0">{c('collider_2025:Info').t`Want to see an example based on you?`}</p>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button className="w-full" color="norm" onClick={onClick}>{c('collider_2025:Button')
                        .t`See my data`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

const WhatLLMKnowsModal = ({ loading, data, ...modalProps }: WhatDoesLLMKnowProps & ModalProps) => {
    console.log('data: ', data);
    return (
        <>
            <ModalTwo {...modalProps}>
                <ModalTwoHeader title="What can LLMs know about me?" />
                <ModalTwoContent className="flex flex-column flex-nowrap gap-2">
                    {loading && (
                        <div className="flex flex-column flex-nowrap flex-1 items-center">
                            <img src={generatingLoader} alt="" className="shrink-0 w-1/5" />
                            <span>{c('collider_2025:Title').t`Generating report...`}</span>
                        </div>
                    )}
                    {!loading &&
                        data &&
                        Object.entries(data).map(([title, info]) => {
                            const { value, certainty } = info;

                            return (
                                <div className="card flex flex-column flex-nowrap rounded-xl p-3" key={title}>
                                    <div className="flex flex-row flex-nowrap justify-space-between">
                                        <h3>{title}</h3>
                                        <span title={certainty}>
                                            <NotificationDot
                                                className="flex"
                                                color={certainty ? DOT_COLOR[certainty] : ThemeColor.Danger}
                                            />
                                        </span>
                                    </div>
                                    <div className="flex flex-row gap-2 p-2">
                                        <WhatLlmKnowsValues value={value} />
                                    </div>
                                </div>
                            );
                        })}
                </ModalTwoContent>
                {/* <ModalTwoFooter>
                    <Button>Secondary action</Button>
                    <Button color="norm">Primary action</Button>
                </ModalTwoFooter> */}
            </ModalTwo>
        </>
    );
};

export const WhatDoesLLMKnowComponent = () => {
    const whatLlmKnowsModal = useModalStateObject();
    const disclaimerModal = useModalStateObject();
    // const dispatch = useLumoDispatch();
    const userMessageMap = useLumoSelector(selectAllUserMessages);
    const userMessages = listify(userMessageMap);
    const [data, setData] = useState<WhatLlmKnowsResponse | undefined>();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const assistantResponseRef = useRef('');
    const api = useApi();

    const cacheRef = useRef<{ cachedData: WhatLlmKnowsResponse } | null>(null);

    if (!(userMessages.length >= MINIMUM_REQUIRED_PROMPTS)) {
        return null;
    }

    // todo generate frontend key pair

    const handleChunk = async (m: GenerationToFrontendMessage) => {
        // todo pass frontend secret key
        if (m.type === 'token_data' && m.target === 'message') {
            assistantResponseRef.current += m.content;
        }
        return {};
    };

    const fetchData = async () => {
        whatLlmKnowsModal.openModal(true);

        if (cacheRef.current !== null && cacheRef.current.cachedData) {
            return setData(cacheRef.current.cachedData);
        }

        assistantResponseRef.current = '';
        // const turns = prepareTurns(userMessages, WHAT_LLM_KNOWS_SYSTEM_TURN);
        const truncatedTurns = userMessages
            .slice(0, MAXIMUM_PROMPTS)
            .map(({ role, content }) => ({ role, content: truncateContent(content) }));
        const finalTruncatedTurns = appendFinalTurn(truncatedTurns, WHAT_LLM_KNOWS_SYSTEM_TURN);
        // console.log('turns: ', turns);

        try {
            // todo pass frontend key
            await withLoading(
                callLumoAssistant(api, finalTruncatedTurns, {
                    config: {},
                    chunkCallback: handleChunk,
                })
            );

            const assistantResponse = assistantResponseRef.current;
            const jsonData = extractAndParseJson(assistantResponse);

            cacheRef.current = { cachedData: jsonData };
            setData(jsonData);
        } catch (error) {
            whatLlmKnowsModal.openModal(false);
            createNotification({
                type: 'error',
                text: c('collider_2025: Failure').t`There was an issue generating the report. Try again later.`,
            });
        }
    };

    return (
        <>
            {' '}
            <SidebarButton
                title={c('collider_2025:Button').t`What can an LLM know about me?`}
                iconName="lightbulb"
                onClick={() => disclaimerModal.openModal(true)}
            />
            {whatLlmKnowsModal.render && (
                <WhatLLMKnowsModal data={data} loading={loading} {...whatLlmKnowsModal.modalProps} />
            )}
            {disclaimerModal.render && (
                <WhatDoesLlmKnowDisclaimerModal
                    onClick={() => {
                        disclaimerModal.openModal(false);
                        void fetchData();
                    }}
                    {...disclaimerModal.modalProps}
                />
            )}
        </>
    );
};
