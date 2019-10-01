import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMailSettings, Loader } from 'react-components';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/mailbox/List';
import View from '../components/mailbox/View';
import ViewPlaceholder from '../components/mailbox/ViewPlaceholder';

const MailboxContainer = ({ labelID, elementID, location, history }) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const elements = [
        {
            ID: 'u8CutWbozPCqqr3TbkGd3Dj1gep59vl7vl5Wof8ymJcrVIQkMoLLgWK26DbkVD85HOiMcthPuJQ_BBH4cH0zQg==',
            Order: 200669421287,
            Subject: 'Gibolin, vous avez 22 nouvelles notifications et 1 message',
            Senders: [{ Address: 'notification@facebookmail.com', Name: 'Facebook' }],
            Recipients: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin Gibo' }],
            NumMessages: 7,
            NumUnread: 3,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 18436,
            ContextSize: 8006,
            ContextTime: 1569921878,
            Time: 1569921878,
            ContextNumMessages: 3,
            ContextNumUnread: 2,
            ContextNumAttachments: 0,
            LabelIDs: [
                '0',
                '4',
                '5',
                'tsj6QImMeKUIwREOx84bg5FBt_3aHQ66yUscdwWwYxcAnuAju5yJpeNGYR2JCBB4uq1T2h9A-dizMf4kRHwbNg==',
                '9SBIb4FYJZ2FOAJO7dZHM76nDg8mZx15L2Nlel7Ki7CuEi2vqpJii3ENxVmwEsQetw756KKOsgucgZyJ01-51g==',
                'KovLQSTvRZaQV2QjwGusXxerOXqfEj-JXK_JiGxrA4D-zQSrYXVqa51cpXG0jyHmKOpfzick_zn9bhzbnL9H4A==',
                'gww96Ot3HESpxS_A8jsKKr0acmkWG3kdN0XfsESdQ3_MCXcJ_aV7JPkXqreUaHwWd27DKyWnKNKMcw9tryUxyQ=='
            ],
            Labels: [
                {
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextTime: 1569921878,
                    ContextSize: 8006,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 4,
                    ContextNumUnread: 1,
                    ContextTime: 1558584018,
                    ContextSize: 10430,
                    ContextNumAttachments: 0,
                    ID: '4'
                },
                {
                    ContextNumMessages: 7,
                    ContextNumUnread: 3,
                    ContextTime: 1569921878,
                    ContextSize: 18436,
                    ContextNumAttachments: 0,
                    ID: '5'
                },
                {
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextTime: 1569921878,
                    ContextSize: 8006,
                    ContextNumAttachments: 0,
                    ID: 'tsj6QImMeKUIwREOx84bg5FBt_3aHQ66yUscdwWwYxcAnuAju5yJpeNGYR2JCBB4uq1T2h9A-dizMf4kRHwbNg=='
                },
                {
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextTime: 1569921878,
                    ContextSize: 10616,
                    ContextNumAttachments: 0,
                    ID: '9SBIb4FYJZ2FOAJO7dZHM76nDg8mZx15L2Nlel7Ki7CuEi2vqpJii3ENxVmwEsQetw756KKOsgucgZyJ01-51g=='
                },
                {
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextTime: 1569921878,
                    ContextSize: 10616,
                    ContextNumAttachments: 0,
                    ID: 'KovLQSTvRZaQV2QjwGusXxerOXqfEj-JXK_JiGxrA4D-zQSrYXVqa51cpXG0jyHmKOpfzick_zn9bhzbnL9H4A=='
                },
                {
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextTime: 1569921878,
                    ContextSize: 10616,
                    ContextNumAttachments: 0,
                    ID: 'gww96Ot3HESpxS_A8jsKKr0acmkWG3kdN0XfsESdQ3_MCXcJ_aV7JPkXqreUaHwWd27DKyWnKNKMcw9tryUxyQ=='
                }
            ]
        },
        {
            ID: 'eFUWKf1_Z8NDxLtOzSuAB4HqOK_wJxNk7aqaWaFsXePe9D0UEDTtcm3MZl4vtajZRitocbqk6_FY1VCr9pLgdQ==',
            Order: 200885332376,
            Subject: 'fdsfdsfds',
            Senders: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin' }],
            Recipients: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin' }],
            NumMessages: 1,
            NumUnread: 0,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 399,
            ContextSize: 399,
            ContextTime: 1569850107,
            Time: 1569850107,
            ContextNumMessages: 1,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
            LabelIDs: ['0', '2', '5', '7'],
            Labels: [
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850107,
                    ContextSize: 399,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850107,
                    ContextSize: 399,
                    ContextNumAttachments: 0,
                    ID: '2'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850107,
                    ContextSize: 399,
                    ContextNumAttachments: 0,
                    ID: '5'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850107,
                    ContextSize: 399,
                    ContextNumAttachments: 0,
                    ID: '7'
                }
            ]
        },
        {
            ID: 'SV6UKGmE5CRFRf2VWgl4kWUIVvBe84S-0iKADZAn5FnUWYn-DUDAJKaGK_q-woNSv66X7mXWFvnqxOD4d-8JqA==',
            Order: 200885331982,
            Subject: 'dsfdsfsdfdsfds',
            Senders: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin' }],
            Recipients: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin' }],
            NumMessages: 1,
            NumUnread: 0,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 401,
            ContextSize: 401,
            ContextTime: 1569850079,
            Time: 1569850079,
            ContextNumMessages: 1,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
            LabelIDs: ['0', '2', '5', '7'],
            Labels: [
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850079,
                    ContextSize: 401,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850079,
                    ContextSize: 401,
                    ContextNumAttachments: 0,
                    ID: '2'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850079,
                    ContextSize: 401,
                    ContextNumAttachments: 0,
                    ID: '5'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569850079,
                    ContextSize: 401,
                    ContextNumAttachments: 0,
                    ID: '7'
                }
            ]
        },
        {
            ID: 'cOoBv2QH-X8sJ4yOFWeOa3epYYHV1jecvu-QT9_dR2tbRv6adE58dXPvVelT84bXhNZquK4Pk0REKHrGBRyPNw==',
            Order: 200885055788,
            Subject: 'Un supair test',
            Senders: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin' }],
            Recipients: [
                { Address: 'gibolin@protonmail.com', Name: 'Gibolin' },
                { Address: 'wozaaaaaa@pm.me', Name: 'wozaaaaaa@pm.me' }
            ],
            NumMessages: 1,
            NumUnread: 0,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 388,
            ContextSize: 388,
            ContextTime: 1569830898,
            Time: 1569830898,
            ContextNumMessages: 1,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
            LabelIDs: ['0', '2', '5', '7'],
            Labels: [
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569830898,
                    ContextSize: 388,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569830898,
                    ContextSize: 388,
                    ContextNumAttachments: 0,
                    ID: '2'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569830898,
                    ContextSize: 388,
                    ContextNumAttachments: 0,
                    ID: '5'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569830898,
                    ContextSize: 388,
                    ContextNumAttachments: 0,
                    ID: '7'
                }
            ]
        },
        {
            ID: '3Ejq7LBdhmUuYgFBvh1M8bmPd71K-kU8awqouGM6DkbunDsy9vrB3evIm1Ye31nVrAQrQ8bHJdqyVAiVeaJO3g==',
            Order: 200884332024,
            Subject:
                "L'Asile de Tortulhu et 7 autres groupes font partie des nouvelles suggestions de groupes pour vous",
            Senders: [{ Address: 'notification@facebookmail.com', Name: 'Facebook' }],
            Recipients: [],
            NumMessages: 1,
            NumUnread: 0,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 4189,
            ContextSize: 4189,
            ContextTime: 1569753773,
            Time: 1569753773,
            ContextNumMessages: 1,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
            LabelIDs: ['0', '5'],
            Labels: [
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569753773,
                    ContextSize: 4189,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569753773,
                    ContextSize: 4189,
                    ContextNumAttachments: 0,
                    ID: '5'
                }
            ]
        },
        {
            ID: 'ILi27yzvF1hjQ5E0A_OT-Wicz2YipF6G_WhzaTPp5UE6BUoWJnGk-H5pWI1CZjmuWv9g81_f6YITVbLVBlqyGA==',
            Order: 200883613889,
            Subject: '\ud83d\udcc4 Solaari et 7 autres Pages sont de nouvelles suggestions pour vous.',
            Senders: [{ Address: 'notification@facebookmail.com', Name: 'Facebook' }],
            Recipients: [],
            NumMessages: 1,
            NumUnread: 0,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 4256,
            ContextSize: 4256,
            ContextTime: 1569668775,
            Time: 1569668775,
            ContextNumMessages: 1,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
            LabelIDs: ['0', '5'],
            Labels: [
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569668775,
                    ContextSize: 4256,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextTime: 1569668775,
                    ContextSize: 4256,
                    ContextNumAttachments: 0,
                    ID: '5'
                }
            ]
        },
        {
            ID: '79ARA7EpcBIgX12LKXSU3_c5bcuGT-gwtX0BeAocWS9VPW67vlSNuQUCFSav3Glqoy3oIGFrQNu6riwUCu-WgA==',
            Order: 200665608513,
            Subject: 'Gibolin, vous avez 19 nouvelles notifications et 1 message',
            Senders: [{ Address: 'notification@facebookmail.com', Name: 'Facebook' }],
            Recipients: [{ Address: 'gibolin@protonmail.com', Name: 'Gibolin Gibo' }],
            NumMessages: 19,
            NumUnread: 2,
            NumAttachments: 0,
            ExpirationTime: 0,
            Size: 51068,
            ContextSize: 51068,
            ContextTime: 1569576487,
            Time: 1569576487,
            ContextNumMessages: 19,
            ContextNumUnread: 2,
            ContextNumAttachments: 0,
            LabelIDs: [
                '0',
                '5',
                'tsj6QImMeKUIwREOx84bg5FBt_3aHQ66yUscdwWwYxcAnuAju5yJpeNGYR2JCBB4uq1T2h9A-dizMf4kRHwbNg==',
                '9SBIb4FYJZ2FOAJO7dZHM76nDg8mZx15L2Nlel7Ki7CuEi2vqpJii3ENxVmwEsQetw756KKOsgucgZyJ01-51g==',
                'KovLQSTvRZaQV2QjwGusXxerOXqfEj-JXK_JiGxrA4D-zQSrYXVqa51cpXG0jyHmKOpfzick_zn9bhzbnL9H4A==',
                'gww96Ot3HESpxS_A8jsKKr0acmkWG3kdN0XfsESdQ3_MCXcJ_aV7JPkXqreUaHwWd27DKyWnKNKMcw9tryUxyQ=='
            ],
            Labels: [
                {
                    ContextNumMessages: 19,
                    ContextNumUnread: 2,
                    ContextTime: 1569576487,
                    ContextSize: 51068,
                    ContextNumAttachments: 0,
                    ID: '0'
                },
                {
                    ContextNumMessages: 19,
                    ContextNumUnread: 2,
                    ContextTime: 1569576487,
                    ContextSize: 51068,
                    ContextNumAttachments: 0,
                    ID: '5'
                },
                {
                    ContextNumMessages: 19,
                    ContextNumUnread: 2,
                    ContextTime: 1569576487,
                    ContextSize: 51068,
                    ContextNumAttachments: 0,
                    ID: 'tsj6QImMeKUIwREOx84bg5FBt_3aHQ66yUscdwWwYxcAnuAju5yJpeNGYR2JCBB4uq1T2h9A-dizMf4kRHwbNg=='
                },
                {
                    ContextNumMessages: 19,
                    ContextNumUnread: 2,
                    ContextTime: 1569576487,
                    ContextSize: 51068,
                    ContextNumAttachments: 0,
                    ID: '9SBIb4FYJZ2FOAJO7dZHM76nDg8mZx15L2Nlel7Ki7CuEi2vqpJii3ENxVmwEsQetw756KKOsgucgZyJ01-51g=='
                }
            ]
        }
    ];
    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);

    const checkedElementIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, []);
    }, [checkedElements]);

    const selectedIDs = useMemo(() => {
        if (checkedElementIDs.length) {
            return checkedElementIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedElementIDs, location.pathname]);

    if (loadingMailSettings) {
        return <Loader />;
    }

    const handleCheckAll = (checked = false) => handleCheck(elements.map(({ ID }) => ID), checked);
    const handleUncheckAll = () => handleCheckAll(false);

    const handleCheck = (IDs = [], checked = false) => {
        const update = IDs.reduce((acc, contactID) => {
            acc[contactID] = checked;
            return acc;
        }, Object.create(null));
        setCheckedElements({ ...checkedElements, ...update });
        setCheckAll(checked && IDs.length === elements.length);
    };

    return (
        <>
            <Toolbar
                labelID={labelID}
                selectedIDs={selectedIDs}
                mailSettings={mailSettings}
                checkAll={checkAll}
                onCheckAll={handleCheckAll}
            />
            <div className="main-area--withToolbar flex-item-fluid flex reset4print">
                <List mailSettings={mailSettings} selectedIDs={selectedIDs} onCheck={handleCheck} />
                {elementID ? (
                    <View mailSettings={mailSettings} elementID={elementID} />
                ) : (
                    <ViewPlaceholder selectedIDs={selectedIDs} onUncheckAll={handleUncheckAll} />
                )}
            </div>
        </>
    );
};

MailboxContainer.propTypes = {
    labelID: PropTypes.string,
    elementID: PropTypes.string,
    location: PropTypes.object,
    history: PropTypes.object
};

export default MailboxContainer;
