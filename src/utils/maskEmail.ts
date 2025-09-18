// src/utils/maskEmail.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal =
    local.length <= 2
      ? local[0] + '*'
      : local.slice(0, 1) +
        '*'.repeat(Math.max(1, local.length - 2)) +
        local.slice(-1);
  return `${maskedLocal}@${domain}`;
}
