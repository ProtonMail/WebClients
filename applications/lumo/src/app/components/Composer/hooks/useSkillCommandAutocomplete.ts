import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    type SkillCommand,
    filterSkillCommands,
    findSlashQuery,
    getSkillCommands,
    groupSkillCommands,
    prependSkillHandle,
} from '../../../features/skills/skillInvocation';
import { useSkills } from '../../../features/skills/useSkills';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { clearPendingSkillCommand } from '../../../redux/slices/composerActions';

export interface SkillCommandState {
    isActive: boolean;
    query: string;
    position: { top: number; left: number } | null;
    /** Index in the textarea value of the `/`. */
    start: number;
    /** Index just after the typed query. */
    end: number;
}

const INITIAL_STATE: SkillCommandState = { isActive: false, query: '', position: null, start: 0, end: 0 };
const EMPTY_COMMANDS: SkillCommand[] = [];
const MENU_WIDTH = 288;

const getMenuPosition = (textarea: HTMLTextAreaElement) => {
    const rect = textarea.getBoundingClientRect();
    const left = Math.min(rect.left + 16, Math.max(16, window.innerWidth - MENU_WIDTH - 16));
    return { top: rect.top, left };
};

/** `/` autocomplete for the user's enabled skills, like Claude's slash commands. */
export const useSkillCommandAutocomplete = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (value: string) => void
) => {
    const isGuest = useIsGuest();
    const { customAgents } = useLumoFlags();
    const enabled = customAgents && !isGuest;
    const { skills } = useSkills({ enabled });
    const [state, setState] = useState<SkillCommandState>(INITIAL_STATE);

    const commands = useMemo(() => (enabled ? getSkillCommands(skills) : EMPTY_COMMANDS), [enabled, skills]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea || !commands.length) {
            setState((prev) => (prev.isActive ? INITIAL_STATE : prev));
            return;
        }
        const cursor = textarea.selectionStart ?? 0;
        const offset = Math.max(0, cursor - 80);
        const found = findSlashQuery(value.slice(offset, cursor));
        const cutMidWord = found?.start === 0 && offset > 0 && !/\s/.test(value[offset - 1]);
        if (!found || cutMidWord) {
            setState((prev) => (prev.isActive ? INITIAL_STATE : prev));
            return;
        }
        const start = offset + found.start;
        setState((prev) =>
            prev.isActive && prev.query === found.query && prev.start === start && prev.end === cursor
                ? prev
                : { isActive: true, query: found.query, position: getMenuPosition(textarea), start, end: cursor }
        );
    }, [value, textareaRef, commands.length]);

    const matches = useMemo(
        () => (state.isActive ? groupSkillCommands(filterSkillCommands(commands, state.query)) : EMPTY_COMMANDS),
        [state.isActive, state.query, commands]
    );

    const close = useCallback(() => setState((prev) => (prev.isActive ? INITIAL_STATE : prev)), []);

    const select = useCallback(
        (command: SkillCommand) => {
            if (!state.isActive) return;
            const token = `/${command.handle} `;
            const rest = value.slice(state.end).replace(/^ /, '');
            setValue(value.slice(0, state.start) + token + rest);
            close();
            const cursor = state.start + token.length;
            setTimeout(() => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(cursor, cursor);
            }, 0);
        },
        [state, value, setValue, close, textareaRef]
    );

    const dispatch = useLumoDispatch();
    const pendingHandle = useLumoSelector((s) => s.composerActions.pendingSkillHandle);
    useEffect(() => {
        if (!pendingHandle) return;
        dispatch(clearPendingSkillCommand());
        const next = prependSkillHandle(value, pendingHandle);
        setValue(next);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(next.length, next.length);
        }, 0);
    }, [pendingHandle, value, setValue, dispatch, textareaRef]);

    const handles = useMemo(() => new Set(commands.map((command) => command.handle)), [commands]);

    return {
        skillCommandState: state,
        skillCommands: matches,
        skillHandles: handles,
        selectSkillCommand: select,
        closeSkillCommand: close,
    };
};
