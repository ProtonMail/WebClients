import { SetStateAction, useState } from 'react';

import { Button, CircleLoader } from '@proton/atoms';
import {
    Checkbox,
    CreateNotificationOptions,
    InputFieldTwo,
    NotificationButton,
    RadioGroup,
    useNotifications,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Notification.mdx';

export default {
    component: Notification,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const { createNotification } = useNotifications();

    const handleClick = (options: CreateNotificationOptions) => () => {
        createNotification(options);
    };

    const defaultWithAction = (
        <>
            <span>I've done the thing</span>
            <NotificationButton onClick={undefined}>Undo</NotificationButton>
        </>
    );

    const warningWithAction = (
        <>
            <span>Oh no, not again</span>
            <NotificationButton notificationType="warning" onClick={undefined}>
                Edit
            </NotificationButton>
        </>
    );

    const types = ['info', 'warning'] as const;

    const BuildYourOwn = () => {
        const [byoExpiration, setByoExpiration] = useState(5000);
        const [byoText, setByoText] = useState('Lorem ipsum');
        const [byoType, setByoType] = useState(types[0]);
        const [byoCloseButton, setCloseButton] = useState(true);

        const [byoButtonShow, setByoButtonShow] = useState(false);
        const [byoButtonText, setByoButtonText] = useState('Undo');

        const [byoLoader, setByoLoader] = useState(false);

        const ByoContent = () => {
            return (
                <>
                    <span>{byoText}</span>
                    {byoButtonShow && (
                        <NotificationButton notificationType={byoType}>{byoButtonText}</NotificationButton>
                    )}
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
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setByoExpiration(Number(event.target.value))
                            }
                        />
                    </div>

                    <Button
                        onClick={handleClick({
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
            <Button color="info" onClick={handleClick({ type: 'info', text: defaultWithAction })} className="mr1 mb1">
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
                onClick={handleClick({ type: 'info', text: defaultWithAction, showCloseButton: false })}
                className="mr1 mb1"
            >
                Default without close button but with an action
            </Button>
            <Button
                color="success"
                onClick={handleClick({
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
                onClick={handleClick({ type: 'warning', text: warningWithAction })}
                className="mr1 mb1"
            >
                Warning with action
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: 'Dammit', showCloseButton: false })}
                className="mr1 mb1"
            >
                Warning without close button
            </Button>
            <Button
                color="warning"
                onClick={handleClick({ type: 'warning', text: warningWithAction, showCloseButton: false })}
                className="mr1 mb1"
            >
                Warning without close button but with an action
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
