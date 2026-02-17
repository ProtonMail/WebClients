import type { ChangeEvent, SetStateAction } from 'react';
import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Checkbox from '@proton/components/components/input/Checkbox';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import type {
    CreateNotificationOptions,
    CustomNotificationProps,
} from '@proton/components/containers/notifications/interfaces';
import useNotifications from '@proton/components/hooks/useNotifications';

const meta: Meta = {
    title: 'Components/Notification',
    parameters: {
        docs: {
            description: {
                component:
                    'Toast-style notifications triggered via the useNotifications hook. Supports info, warning, and success types, custom expiration, action buttons, and loaders.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const ExpandableNotification = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <span>{!open ? 'Expand' : 'Collapse'} me</span>
            {open && <div style={{ height: 100, width: 100 }} />}
            <NotificationButton onClick={() => setOpen(!open)}>{!open ? 'Expand' : 'Collapse'}</NotificationButton>
        </>
    );
};

const CloseableNotification = ({ onClose }: CustomNotificationProps) => (
    <>
        <span>I've done the thing</span>
        <NotificationButton onClick={onClose}>Undo</NotificationButton>
    </>
);

const WarningNotification = ({ onClose }: CustomNotificationProps) => (
    <>
        <span>Oh no, not again</span>
        <NotificationButton onClick={onClose}>Edit</NotificationButton>
    </>
);

export const Default: Story = {
    render: () => {
        const { createNotification } = useNotifications();

        const handleClick = (options: CreateNotificationOptions) => () => {
            createNotification(options);
        };

        const types = ['info', 'warning'] as const;

        const BuildYourOwn = () => {
            const [byoExpiration, setByoExpiration] = useState(5000);
            const [byoText, setByoText] = useState('Lorem ipsum');
            const [byoType, setByoType] = useState<(typeof types)[number]>(types[0]);
            const [byoCloseButton, setCloseButton] = useState(true);
            const [byoButtonShow, setByoButtonShow] = useState(false);
            const [byoButtonText, setByoButtonText] = useState('Undo');
            const [byoLoader, setByoLoader] = useState(false);

            const ByoContent = ({ onClose }: CustomNotificationProps) => (
                <>
                    <span>{byoText}</span>
                    {byoButtonShow && <NotificationButton onClick={onClose}>{byoButtonText}</NotificationButton>}
                    {byoLoader && <CircleLoader />}
                </>
            );

            return (
                <div className="block">
                    <form>
                        <div className="flex flex-column gap-4 mb-4">
                            <InputFieldTwo
                                name="content"
                                id="content"
                                label="Content"
                                value={byoText}
                                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                    setByoText(e.target.value)
                                }
                            />
                            <div>
                                <strong className="block mb-4">Type</strong>
                                <RadioGroup
                                    name="type"
                                    onChange={(v) => setByoType(v)}
                                    value={byoType}
                                    options={types.map((type) => ({ value: type, label: type }))}
                                />
                            </div>
                            <Checkbox
                                id="closebutton"
                                checked={byoCloseButton}
                                onChange={() => {
                                    setCloseButton(!byoCloseButton);
                                    setByoLoader(false);
                                }}
                            >
                                Show Close Button
                            </Checkbox>
                            <Checkbox
                                id="loader"
                                checked={byoLoader}
                                onChange={() => {
                                    setByoLoader(!byoLoader);
                                    setCloseButton(false);
                                }}
                            >
                                Show Loader
                            </Checkbox>
                            <Checkbox
                                id="byoButtonShow"
                                checked={byoButtonShow}
                                onChange={() => setByoButtonShow(!byoButtonShow)}
                            >
                                Show Button
                            </Checkbox>
                            <InputFieldTwo
                                name="byoButtonText"
                                id="byoButtonText"
                                label="Button Text"
                                className="w-custom"
                                style={{ '--w-custom': '10em' } as React.CSSProperties}
                                value={byoButtonText}
                                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                    setByoButtonText(e.target.value)
                                }
                            />
                            <InputFieldTwo
                                name="expiration"
                                id="expiration"
                                label="Expiration"
                                className="w-custom"
                                style={{ '--w-custom': '10em' } as React.CSSProperties}
                                value={byoExpiration}
                                type="number"
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    setByoExpiration(Number(event.target.value))
                                }
                            />
                        </div>
                        <Button
                            onClick={handleClick({
                                key: byoText,
                                type: byoType,
                                text: <ByoContent />,
                                showCloseButton: byoCloseButton,
                                expiration: byoExpiration,
                            })}
                            className="mr-4 mb-4"
                        >
                            Trigger
                        </Button>
                    </form>
                </div>
            );
        };

        return (
            <div>
                <h4 className="mb-4">Presets</h4>
                <Button
                    color="success"
                    onClick={handleClick({ type: 'success', text: 'You did it' })}
                    className="mr-4 mb-4"
                >
                    Default notification
                </Button>
                <Button
                    color="info"
                    onClick={handleClick({ key: 'close', type: 'info', text: <CloseableNotification /> })}
                    className="mr-4 mb-4"
                >
                    Default with action
                </Button>
                <Button
                    color="info"
                    onClick={handleClick({ type: 'info', text: 'whoop', showCloseButton: false })}
                    className="mr-4 mb-4"
                >
                    Default without close button
                </Button>
                <Button
                    color="info"
                    onClick={handleClick({
                        key: 'close2',
                        type: 'info',
                        text: <CloseableNotification />,
                        showCloseButton: false,
                    })}
                    className="mr-4 mb-4"
                >
                    Without close button but with action
                </Button>
                <Button
                    color="success"
                    onClick={handleClick({
                        key: 'spinner',
                        type: 'success',
                        showCloseButton: false,
                        text: (
                            <>
                                Doing the thing... <CircleLoader />
                            </>
                        ),
                    })}
                    className="mr-4 mb-4"
                >
                    Default with spinner
                </Button>
                <Button color="warning" onClick={handleClick({ type: 'warning', text: 'Uh oh' })} className="mr-4 mb-4">
                    Default warning
                </Button>
                <Button
                    color="warning"
                    onClick={handleClick({ key: 'warning', type: 'warning', text: <WarningNotification /> })}
                    className="mr-4 mb-4"
                >
                    Warning with action
                </Button>
                <Button
                    color="warning"
                    onClick={handleClick({
                        key: 'warning2',
                        type: 'warning',
                        text: 'Dammit',
                        showCloseButton: false,
                    })}
                    className="mr-4 mb-4"
                >
                    Warning without close button
                </Button>
                <Button
                    color="warning"
                    onClick={handleClick({
                        key: 'warning3',
                        type: 'warning',
                        text: <WarningNotification />,
                        showCloseButton: false,
                    })}
                    className="mr-4 mb-4"
                >
                    Warning without close but with action
                </Button>
                <Button
                    color="info"
                    onClick={handleClick({
                        key: 'expandable',
                        type: 'info',
                        text: <ExpandableNotification />,
                        expiration: -1,
                    })}
                    className="mr-4 mb-4"
                >
                    Expandable notification
                </Button>

                <hr />
                <h4 className="mb-4">Build your own</h4>
                <BuildYourOwn />
            </div>
        );
    },
};

export const CustomExpiration: Story = {
    render: () => {
        const { createNotification } = useNotifications();

        const handleClick = (options: CreateNotificationOptions) => () => {
            createNotification(options);
        };

        return (
            <div>
                <Button
                    onClick={handleClick({ type: 'info', text: 'I expire after 3 seconds!', expiration: 3000 })}
                    className="mr-4 mb-4"
                >
                    Expires after 3 seconds
                </Button>
                <Button
                    onClick={handleClick({
                        type: 'info',
                        text: 'I expire after 500 milliseconds!',
                        expiration: 500,
                    })}
                    className="mr-4 mb-4"
                >
                    Expires after 500 milliseconds
                </Button>
            </div>
        );
    },
};
