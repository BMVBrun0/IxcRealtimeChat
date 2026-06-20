import { AUTH_COOKIE_NAME } from "./constants";

export const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.split("=")[1]) : null;
};

export const setTokenCookie = (token: string) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
};

export const removeTokenCookie = () => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
