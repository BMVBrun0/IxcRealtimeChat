import { Request, Response } from "express";

export const health = (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    data: {
      status: "ok",
      processId: process.pid,
      uptime: process.uptime()
    }
  });
};
