import { ChangeEvent, SetStateAction, useState } from 'react';

import { Button, CircleLoader } from '@proton/atoms';
import {
    Checkbox,
    CreateNotificationOptions,
    CustomNotificationProps,
    InputFieldTwo,
    NotificationButton,
    RadioGroup,
    useNotifications,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Notification.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const ExpandableNotification = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <span>{!open ? 'Expand' : 'Collapse'} me</span>
            {open && <div style={{ height: 100, width: 100 }}></div>}
            <NotificationButton onClick={() => setOpen(!open)}>{!open ? 'Expand' : 'Collapse'}</NotificationButton>
        </>
    );
};

const CloseableNotification = ({ onClose }: CustomNotificationProps) => {
    return (
        <>
            <span>I've done the thing</span>
            <NotificationButton onClick={onClose}>Undo</NotificationButton>
        </>
    );
};

const WarningNotification = ({ onClose }: CustomNotificationProps) => {
    return (
        <>
            <span>Oh no, not again</span>
            <NotificationButton onClick={onClose}>Edit</NotificationButton>
        </>
    );
};

export const Basic = () => {
    const { createNotification } = useNotifications();

    const handleClick = (options: CreateNotificationOptions) => () => {
        createNotification(options);
    };

    const types = ['info', 'warning'] as const;

    const BuildYourOwn = () => {
        const [byoExpiration, setByoExpiration] = useState(5000);
        const [byoText, setByoText] = useState('Lorem ipsum');
        const [byoType, setByoType] = useState(types[0]);
        const [byoCloseButton, setCloseButton] = useState(true);

        const [byoButtonShow, setByoButtonShow] = useState(false);
        const [byoButtonText, setByoButtonText] = useState('Undo');

        const [byoLoader, setByoLoader] = useState(false);

        const ByoContent = ({ onClose }: CustomNotificationProps) => {
            return (
                <>
                    <span>{byoText}</span>
                    {byoButtonShow && <NotificationButton onClick={onClose}>{byoButtonText}</NotificationButton>}
                    {byoLoader && <CircleLoader />}
                </>
            );
        };

        return (
            <div className="block">
                <form>
                    <div className="flex flex-column flex-gap-1 mb1">
                        <InputFieldTwo
                            name="content"
                            id="content"
                            label="Content"
                            value={byoText}
                            onChange={(e: { target: { value: SetStateAction<string> } }) => setByoText(e.target.value)}
                        />

                        <div>
                            <strong className="block mb1">Type</strong>
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
                            className="w10e"
                            value={byoButtonText}
                            onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                setByoButtonText(e.target.value)
                            }
                        />

                        <InputFieldTwo
                            name="expiration"
                            id="expiration"
                            label="Expiration"
                            className="w10e"
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
                        className="mr1 mb1"
                    >
                        Trigger
                    </Button>
                </form>
            </div>
        );
    };

    return (
        <div>
            <h4 className="mb1">Presets</h4>
            <Button
                color="success"
                onClick={handleClick({
                    type: 'success',
                    text: 'You did it',
                })}
                className="mr1 mb1"
            >
                Default notification
            </Button>
            <Button
                color="info"
                onClick={handleClick({ key: 'close', type: 'info', text: <CloseableNotification /> })}
                className="mr1 mb1"
            >
                Default with action
            </Button>
            <Button
                color="info"
                onClick={handleClick({ type: 'info', text: 'whoop', showCloseButton: false })}
                className="mr1 mb1"
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
                className="mr1 mb1"
            >
                Default without close button but with an action
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
                className="mr1 mb1"
            >
                Default with spinner
            </Button>

            <Button
                color="warning"
                onClick={handleClick({
                    type: 'warning',
                    text: 'Uh oh',
                })}
                className="mr1 mb1"
            >
                Default warning
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ key: 'warning', type: 'warning', text: <WarningNotification /> })}
                className="mr1 mb1"
            >
                Warning with action
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ key: 'warning2', type: 'warning', text: 'Dammit', showCloseButton: false })}
                className="mr1 mb1"
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
                className="mr1 mb1"
            >
                Warning without close button but with an action
            </Button>
            <Button
                color="info"
                onClick={handleClick({
                    key: 'expandable',
                    type: 'info',
                    text: <ExpandableNotification />,
                    expiration: -1,
                })}
                className="mr1 mb1"
            >
                Expandable notification
            </Button>

            <hr />
            <h4 className="mb1">Build your own</h4>
            <BuildYourOwn />
        </div>
    );
};

export const Expiration = () => {
    const { createNotification } = useNotifications();

    const handleClick = (options: CreateNotificationOptions) => () => {
        createNotification(options);
    };

    return (
        <div>
            <Button
                onClick={handleClick({ type: 'info', text: 'I expire after 5 seconds!', expiration: 3000 })}
                className="mr1 mb1"
            >
                Expires after 3 seconds
            </Button>
            <Button
                onClick={handleClick({ type: 'info', text: 'I expire after 500 milliseconds!', expiration: 500 })}
                className="mr1 mb1"
            >
                Expires after 500 milliseconds
            </Button>
        </div>
    );
};
