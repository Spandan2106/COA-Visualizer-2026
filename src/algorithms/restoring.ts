import { toBinary, shiftLeft, addBinary, subtractBinary, getRequiredBits } from '../utils/binaryUtils';

export interface DivisionStep {
  step: number;
  action: string;
  a: string;
  q: string;
  sc: number;
}

export const solveRestoring = (dividend: number, divisor: number) => {
  const n = getRequiredBits(dividend, divisor);
  const m = toBinary(divisor, n);
  const negM = toBinary(-divisor, n);
  let a = '0'.repeat(n);
  let q = toBinary(dividend, n);
  let sc = n;

  const steps: DivisionStep[] = [];

  steps.push({
    step: 0,
    action: 'Initial State',
    a,
    q,
    sc
  });

  while (sc > 0) {
    // Step 1: Shift Left AQ
    [a, q] = shiftLeft(a, q);
    steps.push({ step: n - sc + 1, action: 'Shift Left AQ', a, q, sc });

    // Step 2: A = A - M
    a = addBinary(a, negM);
    steps.push({ step: n - sc + 1, action: 'A = A - M', a, q, sc });

    // Step 3: Check Sign of A
    if (a[0] === '1') {
      // A is negative, restore
      q = q.slice(0, -1) + '0';
      a = addBinary(a, m);
      steps.push({ step: n - sc + 1, action: 'A < 0: Q[0]=0, Restore A', a, q, sc });
    } else {
      // A is positive
      q = q.slice(0, -1) + '1';
      steps.push({ step: n - sc + 1, action: 'A >= 0: Q[0]=1', a, q, sc });
    }

    sc--;
    steps.push({ step: n - sc, action: `End of Cycle ${n - sc}`, a, q, sc });
  }

  return { 
    steps, 
    n, 
    m, 
    dividend, 
    divisor,
    quotient: parseInt(q, 2),
    remainder: parseInt(a, 2)
  };
};
