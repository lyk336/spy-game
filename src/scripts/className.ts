export function createClassName(...classCondition: Array<[string, boolean]>): string {
  let resultClassName: string = '';

  classCondition.forEach(([className, cond]: [string, boolean]) => {
    if (cond) {
      resultClassName += className;
    }
  });

  return resultClassName;
}
