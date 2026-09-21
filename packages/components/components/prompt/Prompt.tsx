import type { ReactElement, ReactNode } from 'react';
import React, { cloneElement, useContext } from 'react';

import { KeyboardKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { HotkeyTuple } from '../../hooks/useHotkeys';
import type { ModalProps } from '../modalTwo/Modal';
import ModalTwo, { ModalContext } from '../modalTwo/Modal';
import type { ModalContentProps } from '../modalTwo/ModalContent';
import ModalTwoContent from '../modalTwo/ModalContent';
import ModalTwoFooter from '../modalTwo/ModalFooter';

import './Prompt.scss';

const PromptTitle = ({ children }: { children: ReactNode }) => (
    <h1 id={useContext(ModalContext).id} className="text-lg text-bold">
        {children}
    </h1>
);

export interface PromptProps extends Omit<ModalProps, 'children' | 'size' | 'title'> {
    disableCloseWhenClickOutside?: boolean;
    title?: string | JSX.Element;
    subline?: string;
    footnote?: string | any[]; //need footnote to accept any[] for ttag with link as variable
    buttons: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element];
    actions?: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | undefined;
    children: ReactNode;
    ModalContentProps?: ModalContentProps;
    'data-testid'?: string;
    /**
     * Allow the Enter hotkey to trigger a destructive (danger-colored) button.
     * Disabled by default to prevent accidental destructive actions.
     * When enabled, only Enter is mapped (Space keeps acting on the focused button).
     */
    enableDangerSubmitHotkey?: boolean;
}

const Prompt = ({
    title,
    subline,
    footnote,
    buttons,
    actions,
    className,
    children,
    ModalContentProps,
    'data-testid': dataTestId,
    disableCloseWhenClickOutside = false,
    enableDangerSubmitHotkey = false,
    ...rest
}: PromptProps) => {
    const buttonArray = Array.isArray(buttons) ? buttons : [buttons];

    const [firstButton, secondButton, thirdButton] = buttonArray.map((child) => {
        // Only add fullWidth to non-div elements (e.g., Button components)
        if ((child as ReactElement).type === 'div') {
            return child as ReactElement;
        }
        return cloneElement(child as ReactElement, { fullWidth: true });
    });

    const actionsContent = (() => {
        if (actions === undefined) {
            return null;
        }

        const actionsArray = Array.isArray(actions) ? actions : [actions];
        const [firstAction, secondAction] = actionsArray.map((child) => cloneElement(child as ReactElement));

        return (
            <div className="prompt-actions">
                <div className="flex flex-column gap-2">
                    {firstAction}
                    {secondAction}
                </div>
            </div>
        );
    })();

    const onSubmitHotkeyPress = async (e: any) => {
        // Prevent the native activation of a focused button so that the
        // hotkey is the single source of truth for the triggered action
        e.preventDefault();
        e.stopPropagation();
        // Filtering out the destructive actions to prevent mistakes, unless
        // explicitly enabled, and removing the weak buttons, as they never are the main action
        const cta = buttonArray.find(
            (button) =>
                (enableDangerSubmitHotkey || button.props.color !== 'danger') &&
                button.props.color !== 'weak' &&
                !button.props.disabled
        );

        cta?.props.onClick?.(e);
    };

    const hotkeys: HotkeyTuple[] = enableDangerSubmitHotkey
        ? [[KeyboardKey.Enter, onSubmitHotkeyPress]]
        : [
              [KeyboardKey.Enter, onSubmitHotkeyPress],
              [KeyboardKey.Space, onSubmitHotkeyPress],
          ];

    return (
        <ModalTwo
            size="small"
            {...rest}
            enableCloseWhenClickOutside={!disableCloseWhenClickOutside}
            className={clsx([className, 'prompt'])}
            hotkeys={hotkeys}
        >
            <div className="prompt-header" data-testid={dataTestId}>
                <PromptTitle>{title}</PromptTitle>
                {subline && <div className="color-weak text-break">{subline}</div>}
            </div>
            <ModalTwoContent {...ModalContentProps}>{children}</ModalTwoContent>
            {actionsContent}
            <ModalTwoFooter className="prompt-footer">
                <div className={clsx('flex gap-2', footnote && 'pb-2')}>
                    {firstButton}
                    {secondButton}
                    {thirdButton}
                </div>
                {footnote && <p className="color-weak text-break text-center text-sm">{footnote}</p>}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default Prompt;
