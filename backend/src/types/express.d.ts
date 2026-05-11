import type { AuthUser } from "../modules/shared/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
