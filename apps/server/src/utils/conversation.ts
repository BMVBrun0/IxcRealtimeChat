export const createConversationKey = (left: string, right: string) => {
  return [left, right].sort().join(":");
};
