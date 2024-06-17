import { c } from 'ttag';

import { WasmApiEmailAddress } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Toggle,
    usePopperAnchor,
} from '@proton/components/components';

import { CoreButton } from '../../atoms';

interface Props {
    /**
     * Expected to have only one element
     */
    value: WasmApiEmailAddress[];
    options: (readonly [WasmApiEmailAddress, boolean])[];
    loading: boolean;

    onRemoveAddress: (addressId: string) => void;
    onAddAddress: (addressId: string) => void;
    onReplaceAddress: (oldAddressId: string, addressId: string) => void;
}

export const EmailIntegrationInput = ({
    value,
    options,
    loading,
    onRemoveAddress,
    onAddAddress,
    onReplaceAddress,
}: Props) => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLButtonElement>();

    const emailId: string | undefined = value?.[0]?.ID;

    return (
        <div className="px-6 py-5">
            <div className="flex flex-row items-center justify-space-between">
                <div className="flex flex-column items-start">
                    <span className="color-hint mb-1">{c('Wallet preferences').t`Email integration`}</span>
                    <span className="color-weak text-sm">{c('Wallet preferences')
                        .t`Send and receive Bitcoin by email with email integration.`}</span>
                    <Href className="color-weak text-sm">{c('Wallet preferences').t`Learn more`}</Href>
                </div>

                <Toggle
                    checked={value.length > 0}
                    onClick={() => {
                        if (value.length < 1) {
                            open();
                        }
                    }}
                />
            </div>

            <div className="my-3">
                {value.map((addr) => (
                    <div className="flex flex-row items-center justify-space-between bg-norm p-2" key={addr.ID}>
                        <div>{addr.Email}</div>
                        <CoreButton
                            disabled={loading}
                            size="small"
                            shape="ghost"
                            icon
                            onClick={() => onRemoveAddress(addr.ID)}
                        >
                            <Icon name="cross" />
                        </CoreButton>
                    </div>
                ))}
            </div>

            <DropdownButton
                disabled={loading}
                shape="ghost"
                ref={anchorRef}
                color="norm"
                className="flex flex-row items-center"
                size="small"
                onClick={() => {
                    open();
                }}
            >
                <Icon name="plus-circle" size={4} />
                <span className="block ml-1">{c('Wallet preferences').t`Add`}</span>
            </DropdownButton>
            <Dropdown isOpen={isOpen} onClose={close} anchorRef={anchorRef} originalPlacement="bottom-start">
                <DropdownMenu>
                    {options.map(([opt, isAvailable]) => {
                        const isSelected = emailId === opt.ID;

                        return (
                            <DropdownMenuButton
                                onClick={() => {
                                    if (isAvailable) {
                                        if (emailId) {
                                            onReplaceAddress(emailId, opt.ID);
                                        } else {
                                            onAddAddress(opt.ID);
                                        }
                                    }

                                    close();
                                }}
                                className="flex flex-row items-center justify-space-between p-2"
                                key={opt.ID}
                                disabled={!isAvailable || loading}
                            >
                                <div>{opt.Email}</div>
                                <div className="flex flex-row flex-nowrap items-center">
                                    {(() => {
                                        if (isSelected || value.some(({ ID }) => ID === opt.ID)) {
                                            return (
                                                <Icon
                                                    size={4}
                                                    name="checkmark-circle-filled"
                                                    className="color-success no-shrink"
                                                />
                                            );
                                        }

                                        if (isAvailable) {
                                            return null;
                                        }

                                        return (
                                            <Icon
                                                size={4}
                                                name="cross-circle-filled"
                                                className="color-danger no-shrink"
                                            />
                                        );
                                    })()}
                                </div>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
                <div className="m-auto px-2 my-1">
                    <Button disabled={loading} className="w-full flex flex-row items-center" shape="ghost" color="norm">
                        <Icon name="plus-circle" size={4} />
                        <span className="block ml-1">{c('Wallet preferences').t`Add a new email address`}</span>
                    </Button>
                </div>
            </Dropdown>
        </div>
    );
};
