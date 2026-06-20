const palette = [
  "#C8ECFF",
  "#C6F6D5",
  "#FDE68A",
  "#FBCFE8",
  "#DDD6FE",
  "#FECACA",
  "#BFDBFE",
  "#F5D0FE"
];

export const createAvatarColor = (seed: string) => {
  const index = seed
    .split("")
    .reduce((accumulator, current) => accumulator + current.charCodeAt(0), 0);

  return palette[index % palette.length];
};
