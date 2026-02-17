import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import type { ModalProps, ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState, { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

const loremIpsum =
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?';

const meta: Meta<typeof ModalTwo> = {
    title: 'Components/Modal',
    component: ModalTwo,
    subcomponents: {
        ModalTwoHeader: ModalTwoHeader as any,
        ModalTwoContent: ModalTwoContent as any,
        ModalTwoFooter: ModalTwoFooter as any,
        Prompt: Prompt as any,
        BasicModal: BasicModal as any,
    },
    parameters: {
        docs: {
            description: {
                component:
                    'A modal dialog component. Composed of ModalTwo, ModalTwoHeader, ModalTwoContent, and ModalTwoFooter. Supports multiple sizes, fullscreen on mobile, form integration, and Prompt/BasicModal variants.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ModalTwo>;

export const Default: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open modal</Button>
                {render && (
                    <ModalTwo {...modalProps}>
                        <ModalTwoHeader title="Example Modal" />
                        <ModalTwoContent>
                            <p>{loremIpsum}</p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const Sizes: Story = {
    render: () => {
        const [size, setSize] = useState<ModalSize>('medium');
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open size modal</Button>
                {render && (
                    <ModalTwo size={size} {...modalProps}>
                        <ModalTwoHeader title="Size" />
                        <ModalTwoContent>
                            <p>{loremIpsum}</p>
                            <div className="mr-8">
                                <strong className="block mb-4">Size</strong>
                                <RadioGroup
                                    name="selected-size"
                                    onChange={setSize}
                                    value={size}
                                    options={(['xsmall', 'small', 'medium', 'large', 'xlarge', 'full'] as const).map(
                                        (s) => ({ value: s, label: s })
                                    )}
                                />
                            </div>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

const WrappedFormModal = (props: ModalProps) => {
    const [name, setName] = useState('');
    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title="Title in ModalHeader" subline="Subline in ModalHeader" />
            <ModalTwoContent>
                <p>I will lose any local state of mine after closing.</p>
                <InputFieldTwo value={name} label="Name" placeholder="e.g. John Fitzgerald..." onValue={setName} />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button>Secondary action</Button>
                <Button color="norm">Primary action</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const UsingUseModalState: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open modal with useModalState</Button>
                {render && <WrappedFormModal {...modalProps} />}
            </div>
        );
    },
};

export const UsingModalStateObject: Story = {
    render: () => {
        const modal = useModalStateObject();

        return (
            <div className="text-center">
                <Button onClick={() => modal.openModal(true)}>Open modal</Button>
                {modal.render && (
                    <ModalTwo {...modal.modalProps}>
                        <ModalTwoHeader title="Example Modal" />
                        <ModalTwoContent>
                            <p>{loremIpsum}</p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const WithHeaderSubline: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open modal with header extras</Button>
                {render && (
                    <ModalTwo {...modalProps}>
                        <ModalTwoHeader title="Title in ModalHeader" subline="Subline in ModalHeader" />
                        <ModalTwoContent>
                            <p className="m-0">{loremIpsum}</p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const WithHeaderActions: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open actions modal</Button>
                {render && (
                    <ModalTwo {...modalProps}>
                        <ModalTwoHeader
                            actions={[
                                <Tooltip title="Get help" key="help">
                                    <Button icon shape="ghost">
                                        <Icon name="question-circle" />
                                    </Button>
                                </Tooltip>,
                                <Tooltip title="Refresh" key="refresh">
                                    <Button icon shape="ghost">
                                        <Icon name="arrows-rotate" />
                                    </Button>
                                </Tooltip>,
                            ]}
                        />
                        <ModalTwoContent>
                            <p className="m-0">{loremIpsum}</p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const ScrollableContent: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open modal with a lot of content</Button>
                {render && (
                    <ModalTwo {...modalProps}>
                        <ModalTwoHeader title="Title in header" />
                        <ModalTwoContent>
                            {Array.from({ length: 10 }, (_, i) => (
                                <p key={i}>{loremIpsum}</p>
                            ))}
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const WithFormRoot: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();
        const [value, setValue] = useState('');

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            window.alert(`Form submitted, value: ${value}.`);
        };

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open modal with form root</Button>
                {render && (
                    <ModalTwo {...modalProps} as={Form} onSubmit={handleSubmit}>
                        <ModalTwoHeader title="Form Modal" />
                        <ModalTwoContent>
                            <p>{loremIpsum}</p>
                            <div className="mt-4">
                                <InputFieldTwo
                                    label="Name"
                                    value={value}
                                    onValue={setValue}
                                    placeholder="e.g. John Fitzgerald"
                                />
                            </div>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button onClick={() => modalProps.onClose()}>Cancel</Button>
                            <Button type="submit" color="norm">
                                Submit
                            </Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const FullscreenOnMobile: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open full screen on mobile modal</Button>
                {render && (
                    <ModalTwo fullscreenOnMobile {...modalProps}>
                        <ModalTwoHeader />
                        <ModalTwoContent>
                            <p>
                                If I&apos;m not full screen you&apos;ll have to make your screen&apos;s width smaller.
                            </p>
                            <p>{loremIpsum}</p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button>Secondary action</Button>
                            <Button color="norm">Primary action</Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        );
    },
};

export const PromptBasic: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open Prompt</Button>
                {render && (
                    <Prompt
                        title="Title"
                        subline="Subline"
                        buttons={[
                            <Button color="danger" key="continue">
                                Continue
                            </Button>,
                            <Button onClick={() => modalProps.onClose()} key="cancel">
                                Cancel
                            </Button>,
                        ]}
                        actions={[<Checkbox key="accept">Accept me</Checkbox>]}
                        {...modalProps}
                    >
                        <p>{loremIpsum}</p>
                    </Prompt>
                )}
            </div>
        );
    },
};

export const PromptSingleButton: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open Prompt with one button</Button>
                {render && (
                    <Prompt
                        title="Title"
                        subline="Subline"
                        buttons={<Button onClick={() => modalProps.onClose()}>I understand</Button>}
                        {...modalProps}
                    >
                        <p>{loremIpsum}</p>
                    </Prompt>
                )}
            </div>
        );
    },
};

export const PromptWithFootnote: Story = {
    render: () => {
        const [modalProps, handleSetOpen, render] = useModalState();

        return (
            <div className="text-center">
                <Button onClick={() => handleSetOpen(true)}>Open Prompt with footnote</Button>
                {render && (
                    <Prompt
                        title="Title"
                        subline="Subline"
                        buttons={[
                            <Button color="danger" key="continue">
                                Continue
                            </Button>,
                            <Button onClick={() => modalProps.onClose()} key="cancel">
                                Cancel
                            </Button>,
                        ]}
                        actions={[<Checkbox key="accept">Accept me</Checkbox>]}
                        footnote="This is a footnote"
                        {...modalProps}
                    >
                        <p>{loremIpsum}</p>
                    </Prompt>
                )}
            </div>
        );
    },
};

export const BasicModalExample: Story = {
    render: () => {
        const [open, setOpen] = useState(false);

        return (
            <div className="text-center">
                <Button onClick={() => setOpen(true)}>Open Basic Modal</Button>
                <BasicModal
                    title="Title"
                    isOpen={open}
                    onClose={() => setOpen(false)}
                    footer={
                        <>
                            <Button onClick={() => setOpen(false)}>I understand</Button>
                            <Button color="norm" onClick={() => setOpen(false)}>
                                I do not understand
                            </Button>
                        </>
                    }
                >
                    <p>{loremIpsum}</p>
                </BasicModal>
            </div>
        );
    },
};
