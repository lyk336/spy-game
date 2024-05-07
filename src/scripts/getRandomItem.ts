export function getRandomItem<T>(array: Array<T>): T {
  const randomIndex: number = Math.floor(Math.random() * array.length);
  const randomItem: T = array[randomIndex];
  return randomItem;
}
