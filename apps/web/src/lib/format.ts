export const formatMessageTime = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

export const formatConversationTime = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
};

export const formatPresenceTime = (value: string | null) => {
  if (!value) {
    return "Offline";
  }

  const date = new Date(value);

  return `Visto às ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)}`;
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
};

export const shortenMessage = (value: string, size = 42) => {
  return value.length <= size ? value : `${value.slice(0, size)}...`;
};

const urlPattern = /((https?:\/\/|www\.)[^\s]+)/gi;

export const hasLink = (value: string) => urlPattern.test(value);

export type MessagePart =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

export const splitMessageLinks = (value: string): MessagePart[] => {
  urlPattern.lastIndex = 0;
  const parts: MessagePart[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(urlPattern)) {
    const matched = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({
        type: "text",
        value: value.slice(lastIndex, index)
      });
    }

    const href = matched.startsWith("http") ? matched : `https://${matched}`;
    parts.push({
      type: "link",
      value: matched,
      href
    });

    lastIndex = index + matched.length;
  }

  if (lastIndex < value.length) {
    parts.push({
      type: "text",
      value: value.slice(lastIndex)
    });
  }

  if (parts.length === 0) {
    return [{ type: "text", value }];
  }

  return parts;
};
