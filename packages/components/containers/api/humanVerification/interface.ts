export type VerificationModel =
    | {
          method: 'sms';
          value: string;
      }
    | {
          method: 'email';
          value: string;
      };
