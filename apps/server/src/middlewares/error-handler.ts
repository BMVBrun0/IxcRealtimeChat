import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

type MongoDuplicateLike = {
  code?: number;
  keyPattern?: Record<string, unknown>;
};

type AppErrorLike = Error & {
  statusCode?: number;
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: "Os dados enviados são inválidos.",
      issues: error.issues
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "A imagem excede o limite de 6 MB."
          : "Não foi possível processar a imagem enviada."
    });
    return;
  }

  const maybeMongoDuplicate = error as MongoDuplicateLike;
  if (maybeMongoDuplicate?.code === 11000) {
    response.status(409).json({
      success: false,
      message: "Este nome de usuário já está em uso."
    });
    return;
  }

  const appError = error as AppErrorLike;
  if (appError?.statusCode) {
    response.status(appError.statusCode).json({
      success: false,
      message: appError.message
    });
    return;
  }

  if (error instanceof Error && /PNG|JPG|JPEG|WEBP/i.test(error.message)) {
    response.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";

  response.status(500).json({
    success: false,
    message
  });
};
