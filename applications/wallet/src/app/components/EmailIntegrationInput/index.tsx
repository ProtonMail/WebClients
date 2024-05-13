import { useState } from 'react';

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
    useModalState,
    usePopperAnchor,
} from '@proton/components/components';

import { CoreButton } from '../../atoms';

interface Props {
    value: WasmApiEmailAddress[];
    options: (readonly [WasmApiEmailAddress, boolean])[];
    loading: boolean;
    onRemoveAddress: (addressId: string) => void;
    onAddAddresses: (addressIds: string[]) => void;
}

export const EmailIntegrationInput = ({ value, options, loading, onRemoveAddress, onAddAddresses }: Props) => {
    const [] = useModalState();
    const { anchorRef, isOpen, close, open } = usePopperAnchor<HTMLButtonElement>();
    const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);

    return (
        <div className="px-6 py-5">
            <div className="flex flex-row items-center justify-space-between">
                <div className="flex flex-column items-start">
                    <span className="color-hint mb-1">{c('Wallet preferences').t`Email integration`}</span>
                    <span className="color-weak text-sm">{c('Wallet preferences')
                        .t`Send and receive Bitcoin by email with email integration.`}</span>
                    <Href className="color-weak text-sm">{c('Wallet preferences').t`Learn more`}</Href>
                </div>

                <Toggle checked={value.length > 0} />
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
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    if (selectedAddresses.length) {
                        onAddAddresses(selectedAddresses);
                    }

                    close();
                }}
                autoClose={false}
                originalPlacement="bottom-start"
            >
                <DropdownMenu>
                    {options.map(([opt, isAvailable]) => {
                        const isSelected = selectedAddresses.includes(opt.ID);

                        return (
                            <DropdownMenuButton
                                onClick={() => {
                                    if (isAvailable) {
                                        setSelectedAddresses((prev) =>
                                            isSelected ? prev.filter((IDb) => IDb !== opt.ID) : [...prev, opt.ID]
                                        );
                                    }
                                }}
                                className="flex flex-row justify-space-between p-2"
                                key={opt.ID}
                                isSelected={isSelected}
                                disabled={!isAvailable || loading}
                            >
                                <div>{opt.Email}</div>
                                <div className="flex">
                                    {(() => {
                                        if (isAvailable) {
                                            return null;
                                        }

                                        if (value.some(({ ID }) => ID === opt.ID)) {
                                            return (
                                                <Icon
                                                    size={4}
                                                    name="checkmark-circle-filled"
                                                    className="color-success"
                                                />
                                            );
                                        }

                                        return <Icon size={4} name="cross-circle-filled" className="color-danger" />;
                                    })()}
                                </div>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
                <div className="m-auto px-2 mt-2">
                    <Button disabled={loading} className="w-full flex flex-row items-center" shape="ghost" color="norm">
                        <Icon name="plus-circle" size={4} />
                        <span className="block ml-1">{c('Wallet preferences').t`Add a new email address`}</span>
                    </Button>
                </div>
            </Dropdown>
        </div>
    );
};
