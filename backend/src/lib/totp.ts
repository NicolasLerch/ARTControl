import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = {
  window: 1,
  step: 30,
};

const APP_NAME = 'ARTControl';

export function createTotpSecret() {
  return authenticator.generateSecret();
}

export function verifyTotpToken(secret: string, token: string) {
  return authenticator.verify({ secret, token });
}

export async function buildTotpEnrollment(email: string, secret: string) {
  const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
  };
}
