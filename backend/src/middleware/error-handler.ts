import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({
      error: {
        message: err.message
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      message: "Internal server error"
    }
  });
};
