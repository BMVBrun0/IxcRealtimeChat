import { NextFunction, Request, Response } from "express";

export const asyncHandler = <
  TRequest extends Request = Request,
  TResponse extends Response = Response
>(
  handler: (request: TRequest, response: TResponse, next: NextFunction) => Promise<unknown>
) => {
  return (request: TRequest, response: TResponse, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
};
