import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// Error messages contain colour codes meant for a terminal; remove them
const plain = (text: string) => text.replace(/\u001b\[[0-9;]*m/g, '');

class ActionableReporter implements Reporter {
  private passedOnRetry: string[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed' || result.status === 'timedOut') {
      console.log(`\nFAILED: ${test.title} (attempt ${result.retry + 1})`);
      const message = plain(result.errors[0]?.message ?? '').replace(/^Error: /, '');
      const firstLines = message.split('\n').filter((line) => line.trim() !== '').slice(0, 3);
      console.log('  Error:', firstLines.join(' | '));
      const screenshot = result.attachments.find((a) => a.name === 'screenshot');
      if (screenshot?.path) console.log('  Screenshot:', screenshot.path);
    }
    // A test that passed, but only after a retry, is flaky
    if (result.status === 'passed' && result.retry > 0) {
      this.passedOnRetry.push(test.title);
    }
  }

  onEnd(_result: FullResult) {
    if (this.passedOnRetry.length > 0) {
      console.log('\nPassed only on retry (add these to the flaky register):');
      this.passedOnRetry.forEach((title) => console.log(`  - ${title}`));
    }
  }
}

export default ActionableReporter;
