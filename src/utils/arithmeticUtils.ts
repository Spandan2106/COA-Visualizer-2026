import { toBinary, addBinary, subtractBinary, getRequiredBits } from './binaryUtils';

export const solveBinaryArithmetic = (val1: number, val2: number, operation: 'add' | 'multiply') => {
  const n = getRequiredBits(val1, val2);
  const bin1 = toBinary(val1, n);
  const bin2 = toBinary(val2, n);
  
  if (operation === 'add') {
    const sum = val1 + val2;
    const binSum = addBinary(bin1, bin2);
    return {
      steps: [
        { label: 'Value 1', decimal: val1, binary: bin1 },
        { label: 'Value 2', decimal: val2, binary: bin2 },
        { label: 'Result (Sum)', decimal: sum, binary: binSum }
      ],
      n
    };
  } else {
    const product = val1 * val2;
    // Multiplication in 2's complement usually involves Booth's or similar, 
    // but for simple arithmetic display we show the result.
    return {
      steps: [
        { label: 'Multiplicand', decimal: val1, binary: bin1 },
        { label: 'Multiplier', decimal: val2, binary: bin2 },
        { label: 'Result (Product)', decimal: product, binary: toBinary(product, n * 2) }
      ],
      n
    };
  }
};
