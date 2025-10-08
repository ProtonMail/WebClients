import type { ReactElement, ReactNode } from 'react';
import React, { cloneElement, useContext } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import type { ModalContentProps } from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import type { HotkeyTuple } from '@proton/components/hooks/useHotkeys';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

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
    ...rest
}: PromptProps) => {
    const buttonArray = Array.isArray(buttons) ? buttons : [buttons];

    const [firstButton, secondButton, thirdButton] = buttonArray.map((child) => {
        // Only add fullWidth to non-div elements (e.g., Button components)
        if ((child as ReactElement).type === 'div') {
            return cloneElement(child as ReactElement);
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
        e.stopPropagation();
        // Filtering out the destructive actions to prevent mistakes
        // and removing the weak buttons, as they never are the main action
        const cta = buttonArray.find(
            (button) => button.props.color !== 'danger' && button.props.color !== 'weak' && !button.props.disabled
        );

        cta?.props.onClick?.(e);
    };

    const hotkeys: HotkeyTuple[] = [
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
