import { toBinary, arithmeticShiftRight, addBinary, subtractBinary, getRequiredBits } from '../utils/binaryUtils';

export interface BoothStep {
  step: number;
  action: string;
  ac: string;
  qr: string;
  qn1: string;
  sc: number;
}

export const solveBooth = (multiplicand: number, multiplier: number) => {
  const n = getRequiredBits(multiplicand, multiplier);
  const br = toBinary(multiplicand, n);
  const negBr = toBinary(-multiplicand, n);
  let ac = '0'.repeat(n);
  let qr = toBinary(multiplier, n);
  let qn1 = '0';
  let sc = n;

  const steps: BoothStep[] = [];

  steps.push({
    step: 0,
    action: 'Initial State',
    ac,
    qr,
    qn1,
    sc
  });

  while (sc > 0) {
    const qn = qr[qr.length - 1];
    const bits = qn + qn1;
    let action = '';

    if (bits === '10') {
      ac = addBinary(ac, negBr);
      action = 'AC = AC - BR';
      steps.push({ step: n - sc + 1, action, ac, qr, qn1, sc });
    } else if (bits === '01') {
      ac = addBinary(ac, br);
      action = 'AC = AC + BR';
      steps.push({ step: n - sc + 1, action, ac, qr, qn1, sc });
    }

    [ac, qr, qn1] = arithmeticShiftRight(ac, qr, qn1);
    sc--;
    action = 'ASHR (AC, QR, Qn+1), SC = SC - 1';
    steps.push({ step: n - sc, action, ac, qr, qn1, sc });
  }

  return { steps, n, br, multiplier, multiplicand };
};
