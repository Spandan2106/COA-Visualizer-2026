/**
 * Utility functions for binary arithmetic and bit manipulation.
 */

export const toBinary = (num: number, bits: number): string => {
  if (num >= 0) {
    return num.toString(2).padStart(bits, '0').slice(-bits);
  } else {
    // Two's complement for negative numbers
    const positiveBinary = Math.abs(num).toString(2).padStart(bits, '0');
    let inverted = '';
    for (let i = 0; i < positiveBinary.length; i++) {
      inverted += positiveBinary[i] === '0' ? '1' : '0';
    }
    const invertedNum = (parseInt(inverted, 2) + 1).toString(2);
    return invertedNum.padStart(bits, '0').slice(-bits);
  }
};

export const fromBinary = (bin: string): number => {
  if (bin[0] === '0') {
    return parseInt(bin, 2);
  } else {
    // Two's complement back to decimal
    let inverted = '';
    for (let i = 0; i < bin.length; i++) {
      inverted += bin[i] === '0' ? '1' : '0';
    }
    return -(parseInt(inverted, 2) + 1);
  }
};

export const addBinary = (bin1: string, bin2: string): string => {
  const bits = bin1.length;
  const sum = (parseInt(bin1, 2) + parseInt(bin2, 2)).toString(2);
  return sum.padStart(bits, '0').slice(-bits);
};

export const subtractBinary = (bin1: string, bin2: string): string => {
  const bits = bin1.length;
  // To subtract, add two's complement of bin2
  const negBin2 = toBinary(-fromBinary(bin2), bits);
  return addBinary(bin1, negBin2);
};

export const shiftLeft = (a: string, q: string): [string, string] => {
  const combined = a + q;
  const shifted = combined.slice(1) + '0';
  return [shifted.slice(0, a.length), shifted.slice(a.length)];
};

export const arithmeticShiftRight = (a: string, q: string, qn1: string): [string, string, string] => {
  const combined = a + q + qn1;
  const signBit = combined[0];
  const shifted = signBit + combined.slice(0, -1);
  return [
    shifted.slice(0, a.length),
    shifted.slice(a.length, a.length + q.length),
    shifted.slice(-1)
  ];
};

export const getRequiredBits = (num1: number, num2: number): number => {
  const maxAbs = Math.max(Math.abs(num1), Math.abs(num2));
  // Need bits for magnitude + 1 for sign
  return Math.max(4, Math.floor(Math.log2(maxAbs || 1)) + 2);
};

export const getConversionSteps = (value: string, fromBase: number, toBase: number) => {
  const isNegative = value.startsWith('-');
  const absValue = isNegative ? value.slice(1) : value;
  let decimal = parseInt(absValue, fromBase);
  if (isNaN(decimal)) return null;

  const steps = [];
  let current = decimal;
  
  if (current === 0) {
    steps.push({ dividend: 0, divisor: toBase, quotient: 0, remainder: '0' });
  } else {
    while (current > 0) {
      const quotient = Math.floor(current / toBase);
      const remainder = current % toBase;
      const remChar = remainder.toString(toBase).toUpperCase();
      steps.push({ 
        dividend: current,
        divisor: toBase,
        quotient, 
        remainder: remChar 
      });
      current = quotient;
    }
  }

  let resultString = '';
  if (isNegative && toBase === 2) {
    // For binary, show 2's complement for negative numbers
    const bits = Math.max(8, Math.floor(Math.log2(decimal)) + 2);
    const positiveBinary = decimal.toString(2).padStart(bits, '0');
    
    // Add steps for 2's complement
    steps.push({ dividend: '---', divisor: '---', quotient: '---', remainder: '---' });
    steps.push({ dividend: 'Magnitude', divisor: 'Binary', quotient: '1\'s Comp', remainder: '2\'s Comp' });
    
    let inverted = '';
    for (let i = 0; i < positiveBinary.length; i++) {
      inverted += positiveBinary[i] === '0' ? '1' : '0';
    }
    const twoComp = (parseInt(inverted, 2) + 1).toString(2).padStart(bits, '0').slice(-bits);
    
    steps.push({ 
      dividend: decimal, 
      divisor: positiveBinary, 
      quotient: inverted, 
      remainder: twoComp 
    });
    
    resultString = twoComp;
  } else {
    const absResult = decimal.toString(toBase).toUpperCase();
    resultString = (isNegative ? '-' : '') + absResult;
  }

  return {
    decimal: isNegative ? -decimal : decimal,
    isNegative,
    resultString,
    steps: steps // Don't reverse if we added the 2's complement steps at the end, or handle it carefully
  };
};

/**
 * Complement Logic
 * r's complement and (r-1)'s complement
 */
export const getComplements = (value: string, base: number) => {
  const isNegative = value.startsWith('-');
  const absValue = isNegative ? value.slice(1) : value;
  const n = Math.max(absValue.length, 4); 
  const decimal = parseInt(absValue, base);
  if (isNaN(decimal)) return null;

  // (r-1)'s complement: (r^n - 1) - N
  const r_minus_1_val = Math.pow(base, n) - 1 - decimal;
  const r_minus_1 = r_minus_1_val.toString(base).toUpperCase().padStart(n, '0');

  // r's complement: r^n - N
  const r_val = Math.pow(base, n) - decimal;
  const r = r_val.toString(base).toUpperCase().padStart(n, '0');

  return {
    r_minus_1,
    r,
    isNegative,
    n,
    value: value, // Original value
    decimal: isNegative ? -decimal : decimal,
    base
  };
};
