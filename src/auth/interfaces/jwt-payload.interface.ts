export interface JWTPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
}
