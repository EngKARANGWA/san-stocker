import * as bcrypt from 'bcrypt';

export function hashValue(value: string, saltRounds: number): Promise<string> {
  return bcrypt.hash(value, saltRounds);
}

export function compareHash(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
