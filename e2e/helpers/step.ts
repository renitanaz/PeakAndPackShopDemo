import { test } from '@playwright/test';

// Wraps a page-object method in test.step, so the report shows it as one named step
export function step(stepName?: string) {
  return function decorator(target: Function, context: ClassMethodDecoratorContext) {
    return function replacementMethod(this: any, ...args: any[]) {
      const name = stepName || `${this.constructor.name}.${String(context.name)}`;
      return test.step(name, async () => {
        return await target.call(this, ...args);
      });
    };
  };
}
