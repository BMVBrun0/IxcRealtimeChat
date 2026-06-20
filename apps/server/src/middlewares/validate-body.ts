import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validateBody = <T>(schema: ZodType<T>) => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.body = result.data;
    next();
  };
};
