export type VerifyType = 'reset-password' | 'signup' | 'two-factor';

export function isVerifyType(value: any): value is VerifyType {
  return (
    value === 'reset-password' || value === 'signup' || value === 'two-factor'
  );
}
