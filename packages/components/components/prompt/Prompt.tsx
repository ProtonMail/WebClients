import { ReactElement, ReactNode, cloneElement, useContext } from 'react';

import clsx from '@proton/utils/clsx';

import { ModalContentProps, ModalContext, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter } from '../modalTwo';

import './Prompt.scss';

const PromptTitle = ({ children }: { children: ReactNode }) => (
    <h1 id={useContext(ModalContext).id} className="text-lg text-bold">
        {children}
    </h1>
);

export interface PromptProps extends Omit<ModalProps, 'children' | 'size' | 'title'> {
    title: string | JSX.Element;
    subline?: string;
    footnote?: string;
    buttons: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element];
    actions?: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | undefined;
    children: ReactNode;
    ModalContentProps?: ModalContentProps;
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
    ...rest
}: PromptProps) => {
    const buttonArray = Array.isArray(buttons) ? buttons : [buttons];

    const [firstButton, secondButton, thirdButton] = buttonArray.map((child) =>
        cloneElement(child as ReactElement, { fullWidth: true })
    );

    const actionsContent = (() => {
        if (actions === undefined) {
            return null;
        }

        const actionsArray = Array.isArray(actions) ? actions : [actions];

        const [firstAction, secondAction] = actionsArray.map((child) => cloneElement(child as ReactElement));

        return (
            <div className="flex flex-column flex-gap-0-5">
                {firstAction}
                {secondAction}
            </div>
        );
    })();

    return (
        <ModalTwo size="small" {...rest} className={clsx([className, 'prompt'])}>
            <div className="prompt-header">
                <PromptTitle>{title}</PromptTitle>
                {subline && <div className="color-weak text-break">{subline}</div>}
            </div>
            <ModalTwoContent {...ModalContentProps}>{children}</ModalTwoContent>
            <div className="prompt-actions">{actionsContent}</div>
            <ModalTwoFooter className="prompt-footer">
                <div className={clsx('flex flex-gap-0-5', footnote && 'pb-2')}>
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
