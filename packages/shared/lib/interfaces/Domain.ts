export interface DKIMKey {
    ID: string;
    Selector: string;
    PublicKey: string;
    Algorithm: number;
    DNSState: number;
    CreateTime: number;
}

export interface DKIMConfig {
    Hostname: string;
    CNAME: string;
    Key: DKIMKey | null;
}

export enum DOMAIN_STATE {
    DOMAIN_STATE_DEFAULT = 0, // Domain's State before verify or after deactivation
    DOMAIN_STATE_VERIFIED = 1, // active once verified
    DOMAIN_STATE_WARN = 2, // detected backward DNS change after ACTIVE
}

export enum VERIFY_STATE {
    VERIFY_STATE_DEFAULT = 0, // 0 is default, no good
    VERIFY_STATE_EXIST = 1, // 1 is has code but doesn't match DB's, no good
    VERIFY_STATE_GOOD = 2, // 2 is has code and matches DB's, good!
}

export enum MX_STATE {
    MX_STATE_DEFAULT = 0, // 0 is default, no good
    MX_STATE_NO_US = 1, // 1 is set but does not have us
    MX_STATE_INC_US = 2, // 2 is includes our MX but priority no good
    MX_STATE_GOOD = 3, // 3 is includes our MX and we are highest and pri is legit, good!
    MX_STATE_BACKUP = 4, // 4 is includes our backup MX as the highest prio, warn but good
}

export enum SPF_STATE {
    SPF_STATE_DEFAULT = 0, // 0 is default, no spf record
    SPF_STATE_ONE = 1, // 1 is has spf record but not us
    SPF_STATE_MULT = 2, // 2 is has multiple spf records, no good
    SPF_STATE_GOOD = 3, // 3 is has spf record and includes us, good!
}

export enum DKIM_STATE {
    DKIM_STATE_DEFAULT = 0,
    DKIM_STATE_ERROR = 3,
    DKIM_STATE_GOOD = 4,
    DKIM_STATE_DELEGATED = 5,
    DKIM_STATE_WARNING = 6,
}

export enum DMARC_STATE {
    DMARC_STATE_DEFAULT = 0, // 0 is default, no dmarc record
    DMARC_STATE_ONE = 1, // 1 is found entries but format wrong
    DMARC_STATE_MULT = 2, // 2 is multiple dmarc records, no good
    DMARC_STATE_GOOD = 3, // 3 is good!
    DMARC_STATE_RELAXED = 4, // 4 also good, but additionally indicates relaxed DKIM
}

export interface Domain {
    ID: string;
    DomainName: string;
    VerifyCode: string;
    DkimPublicKey: string;
    State: DOMAIN_STATE;
    CheckTime: number;
    LastActiveTime: number;
    WarnTime: number;
    VerifyState: VERIFY_STATE; // 0 is default, 1 is has code but wrong, 2 is good
    MxState: MX_STATE; // 0 is default, 1 is set but no us, 2 has us but priority is wrong, 3 is good
    SpfState: SPF_STATE; // 0 is default, 1 and 2 means detected a record but wrong, 3 is good
    DKIM: {
        State: DKIM_STATE; // 0 is default, 1 and 2 means detected record but wrong, 3 means key is wrong, 4 is good, 5 is turned off by user through DNS
        Config: DKIMConfig[];
    };
    DmarcState: DMARC_STATE; // 0 is default, 1 and 2 means detected record but wrong, 3 is good
    Flags: {
        'mail-intent': boolean;
        'sso-intent': boolean;
        'dark-web-monitoring': boolean;
    };
}
