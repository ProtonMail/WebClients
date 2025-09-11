import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { editMember } from '@proton/account/members/actions';
import { Button } from '@proton/atoms';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';
import useErrorHandler from '../../hooks/useErrorHandler';

interface Props extends Omit<ModalProps, 'children' | 'buttons'> {
    members: EnhancedMember[];
}

export const ConfirmUnprivatizeMembersModal = ({ members, ...rest }: Props) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [current, setCurrent] = useState<EnhancedMember | null>(null);
    const [excludeSet, setExcludeSet] = useState(() => new Set<string>());
    const [, rerender] = useState<any>();
    const handleError = useErrorHandler();
    const api = useApi();
    const [workingSet, setWorkingSet] = useState<EnhancedMember[] | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const abortController = new AbortController();
        abortRef.current = abortController;
        return () => {
            abortController.abort();
        };
    }, []);

    const handleUnprivatize = async (member: EnhancedMember) => {
        try {
            await dispatch(
                editMember({
                    api,
                    member,
                    memberDiff: { private: MEMBER_PRIVATE.READABLE },
                    memberKeyPacketPayload: null,
                })
            );
        } catch (e) {
            handleError(e);
        }
    };

    const handleStart = async () => {
        try {
            setLoading(true);
            const filteredMembers = members.filter((member) => !excludeSet.has(member.ID));
            setWorkingSet(filteredMembers);
            for (const member of filteredMembers) {
                if (abortRef.current?.signal.aborted) {
                    return;
                }

                setCurrent(member);

                await handleUnprivatize(member);
                await wait(1000);

                setWorkingSet((workingSet) => {
                    if (!workingSet) {
                        return workingSet;
                    }
                    return workingSet.filter((otherMember) => otherMember.ID !== member.ID);
                });
                setCurrent(null);
            }
            rest.onClose?.();
        } catch {
        } finally {
            setWorkingSet(null);
            setLoading(false);
        }
    };

    const n = workingSet ? workingSet.length : members.length - excludeSet.size;
    const cta = c('Action').ngettext(
        msgid`Enable administrator access for ${n} member`,
        `Enable administrator access for ${n} members`,
        n
    );

    return (
        <ModalTwo {...rest} size="large">
            <ModalTwoHeader title={c('Title').t`Enable administrator access`} />
            <ModalTwoContent>
                {(() => {
                    if (!current) {
                        return null;
                    }

                    const member = current;
                    const memberName = member.Name;
                    const memberAddress = member.Addresses?.[0];
                    const memberEmail = memberAddress?.Email || memberName;

                    return (
                        <div className="h-custom" style={{ '--h-custom': '5rem' }}>
                            <div>
                                <b>Enabling administrator access for:</b>
                                <div className="rounded bg-weak p-2">
                                    <div className="text-bold text-break">{memberName}</div>
                                    {memberEmail !== memberName && (
                                        <div className="color-weak text-break" title={memberEmail}>
                                            {memberEmail}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
                {(() => {
                    if (current) {
                        return null;
                    }
                    return (
                        <>
                            <b>Members:</b>
                            <div className="flex flex-column gap-2 p-2">
                                {members.map((member) => {
                                    const memberName = member.Name;
                                    const memberAddress = member.Addresses?.[0];
                                    const memberEmail = memberAddress?.Email || memberName;

                                    return (
                                        <div key={member.ID} className="flex flex-nowrap items-center">
                                            <div className="flex-1">
                                                <div className="text-bold text-break">{memberName}</div>
                                                {memberEmail !== memberName && (
                                                    <div className="color-weak text-break" title={memberEmail}>
                                                        {memberEmail}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-custom" style={{ '--w-custom': '5rem' }}>
                                                {!excludeSet.has(member.ID) && (
                                                    <Button
                                                        shape="ghost"
                                                        onClick={() => {
                                                            setExcludeSet((set) => {
                                                                set.add(member.ID);
                                                                rerender({});
                                                                return set;
                                                            });
                                                        }}
                                                    >{c('Action').t`Exclude`}</Button>
                                                )}
                                                {excludeSet.has(member.ID) && (
                                                    <Button
                                                        shape="ghost"
                                                        onClick={() => {
                                                            setExcludeSet((set) => {
                                                                set.delete(member.ID);
                                                                rerender({});
                                                                return set;
                                                            });
                                                        }}
                                                    >{c('Action').t`Include`}</Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    loading={loading}
                    type="button"
                    onClick={() => {
                        void handleStart();
                    }}
                >
                    {cta}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
