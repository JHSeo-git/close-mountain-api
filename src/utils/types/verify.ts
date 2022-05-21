export type VerificationUseType = 'reset-password' | 'signup' | 'two-factor';
export type VerificationProvider = 'email'; // | 'mobile' | 'googleOTP';

export function isVericationUseType(value: any): value is VerificationUseType {
  return (
    value === 'reset-password' || value === 'signup' || value === 'two-factor'
  );
}

export function isVerificationProvider(
  value: any,
): value is VerificationProvider {
  return value === 'email';
}
