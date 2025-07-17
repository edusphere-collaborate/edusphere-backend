import * as bcrypt from 'bcrypt';

export async function hashPassword(plainPassword: string) {
  const SALT = bcrypt.genSaltSync();
  return bcrypt.hash(plainPassword, SALT);
}

export function comparePassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}
