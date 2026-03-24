
export interface IEEE754Result {
  value: string;
  precision: 'single' | 'double';
  sign: string;
  exponent: string;
  mantissa: string;
  hex: string;
  binary: string;
  steps: { label: string; value: string; description?: string }[];
}

export const decimalToIEEE754 = (num: number, precision: 'single' | 'double'): IEEE754Result => {
  const isSingle = precision === 'single';
  const bits = isSingle ? 32 : 64;
  const expBits = isSingle ? 8 : 11;
  const mantissaBits = isSingle ? 23 : 52;
  const bias = isSingle ? 127 : 1023;

  const steps: { label: string; value: string; description?: string }[] = [];
  steps.push({ label: 'Input Number', value: num.toString() });

  // 1. Sign bit
  const sign = num < 0 ? '1' : '0';
  steps.push({ label: 'Sign Bit (S)', value: sign, description: num < 0 ? 'Negative number' : 'Positive number' });

  let absNum = Math.abs(num);

  if (absNum === 0) {
    const zeroExp = '0'.repeat(expBits);
    const zeroMant = '0'.repeat(mantissaBits);
    return {
      value: num.toString(),
      precision,
      sign,
      exponent: zeroExp,
      mantissa: zeroMant,
      hex: '0'.repeat(bits / 4),
      binary: sign + zeroExp + zeroMant,
      steps: [...steps, { label: 'Special Case', value: 'Zero', description: 'Exponent and mantissa are all zeros' }]
    };
  }

  // 2. Normalize
  let exponent = Math.floor(Math.log2(absNum));
  let normalized = absNum / Math.pow(2, exponent);
  
  // Handle subnormal numbers if needed (simplified for common cases)
  steps.push({ 
    label: 'Normalization', 
    value: `${normalized.toFixed(6)} × 2^${exponent}`, 
    description: 'Number converted to 1.f × 2^E format' 
  });

  // 3. Biased Exponent
  const biasedExp = exponent + bias;
  const expBinary = biasedExp.toString(2).padStart(expBits, '0');
  steps.push({ 
    label: 'Biased Exponent', 
    value: `${biasedExp} (${expBinary})`, 
    description: `E = exponent + bias (${exponent} + ${bias})` 
  });

  // 4. Mantissa (Fraction)
  let fraction = normalized - 1;
  let mantissaBinary = '';
  let tempFrac = fraction;
  for (let i = 0; i < mantissaBits; i++) {
    tempFrac *= 2;
    if (tempFrac >= 1) {
      mantissaBinary += '1';
      tempFrac -= 1;
    } else {
      mantissaBinary += '0';
    }
  }
  steps.push({ 
    label: 'Mantissa (Fraction)', 
    value: mantissaBinary, 
    description: `First ${mantissaBits} bits of the fractional part` 
  });

  const fullBinary = sign + expBinary + mantissaBinary;
  
  // Convert to Hex
  let hex = '';
  for (let i = 0; i < fullBinary.length; i += 4) {
    hex += parseInt(fullBinary.substr(i, 4), 2).toString(16).toUpperCase();
  }

  return {
    value: num.toString(),
    precision,
    sign,
    exponent: expBinary,
    mantissa: mantissaBinary,
    hex,
    binary: fullBinary,
    steps
  };
};

export const ieee754ToDecimal = (hexOrBin: string, precision: 'single' | 'double'): any => {
  let binary = '';
  const isSingle = precision === 'single';
  const bits = isSingle ? 32 : 64;
  const expBits = isSingle ? 8 : 11;
  const mantissaBits = isSingle ? 23 : 52;
  const bias = isSingle ? 127 : 1023;

  // Convert hex to binary if needed
  if (hexOrBin.match(/^[0-9A-Fa-f]+$/)) {
    binary = hexOrBin.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
  } else {
    binary = hexOrBin.replace(/\s/g, '');
  }

  binary = binary.padStart(bits, '0').slice(0, bits);

  const signBit = binary[0];
  const expPart = binary.slice(1, 1 + expBits);
  const mantissaPart = binary.slice(1 + expBits);

  const biasedExp = parseInt(expPart, 2);
  const sign = signBit === '1' ? -1 : 1;

  const steps: any[] = [];
  steps.push({ label: 'Input Binary', value: binary });
  steps.push({ label: 'Sign Bit', value: signBit, description: signBit === '1' ? 'Negative' : 'Positive' });
  steps.push({ label: 'Exponent Bits', value: expPart, description: `Biased Exponent = ${biasedExp}` });
  steps.push({ label: 'Mantissa Bits', value: mantissaPart });

  if (biasedExp === 0 && mantissaPart.indexOf('1') === -1) {
    return { value: sign * 0, steps, result: sign * 0 };
  }

  // Special cases: Infinity, NaN
  if (biasedExp === Math.pow(2, expBits) - 1) {
    if (mantissaPart.indexOf('1') === -1) {
      return { value: sign === 1 ? 'Infinity' : '-Infinity', steps, result: sign * Infinity };
    } else {
      return { value: 'NaN', steps, result: NaN };
    }
  }

  const exponent = biasedExp - bias;
  steps.push({ label: 'Actual Exponent', value: exponent.toString(), description: `E = Biased - Bias (${biasedExp} - ${bias})` });

  let mantissaValue = 1;
  for (let i = 0; i < mantissaPart.length; i++) {
    if (mantissaPart[i] === '1') {
      mantissaValue += Math.pow(2, -(i + 1));
    }
  }
  steps.push({ label: 'Mantissa Value', value: mantissaValue.toFixed(10), description: '1 + fractional part' });

  const result = sign * mantissaValue * Math.pow(2, exponent);
  steps.push({ label: 'Final Calculation', value: `${sign} × ${mantissaValue.toFixed(6)} × 2^${exponent}` });

  return {
    value: result.toString(),
    steps,
    result,
    sign: signBit,
    exponent: expPart,
    mantissa: mantissaPart
  };
};
