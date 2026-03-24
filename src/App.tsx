import { useState, useEffect } from 'react';
import { solveBooth } from './algorithms/booth';
import { solveRestoring } from './algorithms/restoring';
import { solveNonRestoring } from './algorithms/nonRestoring';
import { getConversionSteps, getComplements, toBinary, getRequiredBits } from './utils/binaryUtils';
import { solveBinaryArithmetic } from './utils/arithmeticUtils';
import { decimalToIEEE754, ieee754ToDecimal } from './utils/ieee754Utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Calculator, Table as TableIcon, Image as ImageIcon, 
  ArrowRight, ChevronRight, Info, X, ZoomIn, Sun, Moon, 
  RefreshCw, BookOpen, Hash, Layers, Binary, Cpu as Chip
} from 'lucide-react';
import boothImg from './public/booth.png';
import restoringImg from './public/restoring.png';
import nonRestoringImg from './public/nonrestoring.png';

type Algorithm = 'booth' | 'restoring' | 'non-restoring' | 'conversion' | 'complement' | 'arithmetic' | 'ieee754';
type Base = 2 | 8 | 10 | 16;

const ALGO_DETAILS = {
  'booth': {
    title: "Booth's Algorithm",
    description: "A powerful multiplication algorithm for signed binary numbers in two's complement. It optimizes the process by skipping sequences of 1s or 0s, reducing the number of additions/subtractions required.",
    keyPoints: ["Handles signed numbers", "Uses Arithmetic Shift Right (ASHR)", "Based on bit pairs (Qn, Qn+1)"],
    theory: "Booth's algorithm works by examining adjacent bits of the multiplier. It identifies strings of 0s (no operation) and strings of 1s (one subtraction at the start and one addition at the end). This significantly reduces the number of partial products generated in hardware."
  },
  'restoring': {
    title: "Restoring Division",
    description: "A standard division algorithm for unsigned integers. It subtracts the divisor from the accumulator; if the result is negative, it 'restores' the original value by adding the divisor back.",
    keyPoints: ["Unsigned division", "Restores A if A < 0", "Simple but more operations"],
    theory: "In restoring division, we perform A = A - M. If the result is negative (MSB of A is 1), we set the quotient bit to 0 and restore A by adding M back (A = A + M). If positive, we set the quotient bit to 1. This process repeats for all bits of the dividend."
  },
  'non-restoring': {
    title: "Non-Restoring Division",
    description: "An optimized version of restoring division. It avoids the restoration step by performing an addition in the next cycle if the current remainder is negative, making it faster in hardware.",
    keyPoints: ["Faster hardware implementation", "No restoration step", "Final correction may be needed"],
    theory: "Non-restoring division improves speed by skipping the restoration step. If A is negative, we don't add M back immediately. Instead, in the next step, we shift and then add M (A = 2A + M). If A is positive, we shift and subtract M (A = 2A - M). This reduces the total number of arithmetic operations."
  },
  'conversion': {
    title: "Base Conversion",
    description: "Converting numbers between different positional number systems (Binary, Octal, Decimal, Hexadecimal).",
    keyPoints: ["Positional weight method", "Successive division/multiplication", "Grouping method for power-of-2 bases"],
    theory: "Base conversion involves changing the representation of a number from one base (radix) to another. For decimal to other bases, we use successive division by the target radix. For other bases to decimal, we sum the products of digits and their positional weights (radix^position)."
  },
  'complement': {
    title: "Complements",
    description: "Complements are used in digital computers to simplify subtraction and for logical manipulation.",
    keyPoints: ["r's complement (Radix)", "(r-1)'s complement (Diminished Radix)", "Used for negative number representation"],
    theory: "Complements allow us to perform subtraction using addition hardware. In binary, the 1's complement is obtained by flipping all bits, and the 2's complement is obtained by adding 1 to the 1's complement. 2's complement is the standard for signed integer representation."
  },
  'arithmetic': {
    title: "Binary Arithmetic",
    description: "Performing basic mathematical operations like addition and multiplication directly on binary representations.",
    keyPoints: ["Two's complement addition", "Overflow detection", "Bit-wise logic"],
    theory: "Binary arithmetic follows rules similar to decimal but with only two digits. Addition involves carries, and multiplication is a series of shifts and additions. In computer systems, these are implemented using logic gates like XOR for sum and AND for carry."
  },
  'ieee754': {
    title: "IEEE 754 Standard",
    description: "The most widely used standard for floating-point computation. It defines formats for representing real numbers in binary, including single (32-bit) and double (64-bit) precision.",
    keyPoints: ["Sign, Exponent, Mantissa", "Biased exponent representation", "Normalization (1.f format)"],
    theory: "IEEE 754 represents real numbers as ±1.f × 2^(E-Bias). The sign bit determines positivity/negativity. The exponent is biased to allow for easy comparison. The mantissa (fraction) stores the significant digits, with an implicit leading 1 for normalized numbers."
  }
};

const STORIES = [
  {
    id: 'binary',
    title: "The Story of Binary",
    content: "The modern binary number system was studied in Europe in the 16th and 17th centuries by Thomas Harriot, Juan Caramuel y Lobkowitz, and Gottfried Leibniz. However, systems related to binary numbers have appeared earlier in many cultures including ancient Egypt, China, and India. Leibniz specifically saw the binary system as a symbol of creation, where 1 represented God and 0 represented nothingness."
  },
  {
    id: 'octal',
    title: "The Mystery of Octal",
    content: "Octal (base-8) was once a major competitor to hexadecimal. It was popular in early computers like the PDP-8 because it allowed 12-bit or 36-bit words to be easily divided into 3-bit groups. While hexadecimal eventually won the 'war' for 8-bit architectures, octal remains a fascinating relic of the era when word sizes were often multiples of 3."
  },
  {
    id: 'decimal',
    title: "The Human Decimal",
    content: "Decimal is the most widely used number system, primarily because humans have ten fingers. It's an intuitive system for us, but for computers, it's actually quite inefficient. Early computers like ENIAC used decimal, but engineers soon realized that binary (on/off) was far more reliable and easier to implement with electronic switches."
  },
  {
    id: 'hex',
    title: "The Rise of Hexadecimal",
    content: "Hexadecimal was first used in the Bendix G-15 computer in 1956. It became the standard way to represent binary data because 4 bits (a nibble) map perfectly to one hex digit. This makes it much easier for humans to read memory addresses and machine code compared to long strings of 1s and 0s."
  },
  {
    id: 'coa-vs-ca',
    title: "Architecture vs. Organization",
    content: "Computer Architecture (CA) refers to the attributes of a system visible to a programmer (instruction set, number of bits used to represent data, I/O mechanisms). Computer Organization (CO) refers to the operational units and their interconnections that realize the architectural specifications (hardware details like control signals, interfaces, memory technology). Architecture is the 'what', and Organization is the 'how'."
  },
  {
    id: 'complements',
    title: "Why Complements?",
    content: "In early computer design, building separate hardware for addition and subtraction was expensive and complex. Engineers realized that by using complements, subtraction could be performed using the same hardware as addition. This led to the widespread adoption of Two's Complement, which also solved the problem of having 'positive zero' and 'negative zero'."
  },
  {
    id: 'small-numbers',
    title: "The Power of Small Numbers",
    content: "In the early days of computing, every bit was precious. Memory was measured in bytes, not gigabytes. This forced engineers to be incredibly clever with how they represented data. Small number systems like 4-bit or 8-bit architectures laid the foundation for the complex 64-bit systems we use today. Understanding how a simple 4-bit adder works is the first step to understanding modern supercomputers."
  },
  {
    id: 'ieee754',
    title: "The Floating Point Standard",
    content: "Before IEEE 754 was established in 1985, every computer manufacturer had their own way of representing floating-point numbers. This made it nearly impossible to write portable scientific software. The IEEE 754 standard, led by William Kahan, unified these representations, ensuring that a calculation performed on an IBM machine would yield the same result on a DEC or Intel machine."
  }
];

type View = 'landing' | 'app' | 'theories';

const IEEE_RULES = [
  {
    title: "Single Precision (32-bit)",
    rules: [
      "1 bit for Sign (S)",
      "8 bits for Biased Exponent (E)",
      "23 bits for Mantissa (M)",
      "Bias value is 127",
      "Range: ±1.18 × 10^-38 to ±3.4 × 10^38"
    ]
  },
  {
    title: "Double Precision (64-bit)",
    rules: [
      "1 bit for Sign (S)",
      "11 bits for Biased Exponent (E)",
      "52 bits for Mantissa (M)",
      "Bias value is 1023",
      "Range: ±2.23 × 10^-308 to ±1.8 × 10^308"
    ]
  },
  {
    title: "Special Values",
    rules: [
      "Zero: Exponent = 0, Mantissa = 0",
      "Infinity: Exponent = All 1s, Mantissa = 0",
      "NaN (Not a Number): Exponent = All 1s, Mantissa ≠ 0",
      "Denormalized: Exponent = 0, Mantissa ≠ 0"
    ]
  }
];

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [algo, setAlgo] = useState<Algorithm>('booth');
  const [val1, setVal1] = useState<string>('7');
  const [val2, setVal2] = useState<string>('3');
  const [arithmeticOp, setArithmeticOp] = useState<'add' | 'multiply'>('add');
  const [ieeePrecision, setIeeePrecision] = useState<'single' | 'double'>('single');
  const [ieeeDirection, setIeeeDirection] = useState<'toIEEE' | 'fromIEEE'>('toIEEE');
  const [fromBase, setFromBase] = useState<Base>(10);
  const [toBase, setToBase] = useState<Base>(2);
  const [result, setResult] = useState<any>(null);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const handleClear = () => {
    setVal1('');
    setVal2('');
    setResult(null);
  };

  const handleCalculate = () => {
    if (algo === 'booth') {
      setResult(solveBooth(parseInt(val1), parseInt(val2)));
    } else if (algo === 'restoring') {
      // Division algorithms are for unsigned integers, treat as positive
      const v1 = Math.abs(parseInt(val1));
      const v2 = Math.abs(parseInt(val2));
      setResult(solveRestoring(v1, v2));
    } else if (algo === 'non-restoring') {
      // Division algorithms are for unsigned integers, treat as positive
      const v1 = Math.abs(parseInt(val1));
      const v2 = Math.abs(parseInt(val2));
      setResult(solveNonRestoring(v1, v2));
    } else if (algo === 'conversion') {
      const res = getConversionSteps(val1, fromBase, toBase);
      if (res) {
        setResult({ 
          type: 'conversion', 
          from: val1, 
          fromBase, 
          to: res.resultString, 
          toBase,
          steps: res.steps,
          isNegative: res.isNegative
        });
      }
    } else if (algo === 'complement') {
      const res = getComplements(val1, fromBase);
      setResult({ type: 'complement', value: val1, base: fromBase, ...res });
    } else if (algo === 'arithmetic') {
      setResult(solveBinaryArithmetic(parseInt(val1), parseInt(val2), arithmeticOp));
    } else if (algo === 'ieee754') {
      if (ieeeDirection === 'toIEEE') {
        const res = decimalToIEEE754(parseFloat(val1), ieeePrecision);
        setResult({ type: 'ieee754', ...res });
      } else {
        const res = ieee754ToDecimal(val1, ieeePrecision);
        setResult({ type: 'ieee754_reverse', ...res, precision: ieeePrecision });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden py-20"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 100 + '%', 
                    y: Math.random() * 100 + '%',
                    opacity: 0.1
                  }}
                  animate={{ 
                    y: [null, '-20%', '120%'],
                    opacity: [0.1, 0.4, 0.1]
                  }}
                  transition={{ 
                    duration: 10 + Math.random() * 10, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute text-[10px] font-mono text-emerald-500/30"
                >
                  {Math.random() > 0.5 ? '0' : '1'}
                </motion.div>
              ))}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full"
              />
              <motion.div 
                animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                transition={{ duration: 25, repeat: Infinity }}
                className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"
              />
            </div>

            <div className="relative z-10 text-center px-6 w-full max-w-5xl flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-inner"
              >
                <Chip size={56} className="text-emerald-600" />
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-6xl md:text-9xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-transparent leading-none"
              >
                COA LAB
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg md:text-2xl text-slate-500 mb-10 font-medium leading-relaxed max-w-3xl"
              >
                Interactive visualizations for Computer Organization and Architecture. Master algorithms, number systems, and hardware logic in real-time.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full"
              >
                <button
                  onClick={() => setView('app')}
                  className="group px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
                >
                  Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={() => setView('theories')}
                  className="group px-10 py-5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center gap-3 w-full sm:w-auto justify-center border border-slate-200"
                >
                  See Theories <BookOpen size={20} />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]"
              >
                Version 2.1 • Spandan2106
              </motion.div>
            </div>
          </motion.div>
        ) : view === 'theories' ? (
          <motion.div
            key="theories"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="min-h-screen bg-slate-50 py-12 px-4 md:px-8"
          >
            <div className="max-w-4xl mx-auto">
              <header className="flex items-center justify-between mb-12">
                <button 
                  onClick={() => setView('landing')}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  <ArrowRight className="rotate-180" size={18} /> Back to Home
                </button>
                <h1 className="text-3xl font-bold tracking-tight">Theory & History</h1>
                <div className="w-20" />
              </header>

              <div className="space-y-8">
                {/* IEEE 754 Deep Dive */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                      <Chip size={24} />
                    </div>
                    <h2 className="text-2xl font-bold">IEEE 754 Floating Point Standard</h2>
                  </div>
                  
                  <div className="prose prose-slate max-w-none">
                    <h3 className="text-lg font-bold mb-3">History</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      Before 1985, floating-point arithmetic was a chaotic landscape. Each computer manufacturer implemented their own logic, leading to inconsistent results across different machines. William Kahan, a professor at UC Berkeley, led the IEEE committee to standardize this. The result was IEEE 754, which unified representations and ensured mathematical reliability globally.
                    </p>

                    <h3 className="text-lg font-bold mb-4">Core Rules & Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {IEEE_RULES.map((group, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                          <h4 className="font-bold text-sm mb-3 text-blue-600">{group.title}</h4>
                          <ul className="space-y-2">
                            {group.rules.map((rule, j) => (
                              <li key={j} className="text-xs text-slate-500 flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold mb-4">The Normalization Process</h3>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-8">
                      <p className="text-sm text-emerald-800 font-mono mb-2">Formula: (-1)^S × (1 + Fraction) × 2^(E - Bias)</p>
                      <p className="text-xs text-emerald-600 leading-relaxed">
                        The "1 + Fraction" part is why we call it normalized. We always assume there's a leading '1' before the binary point, so we only store the fractional part (the mantissa) to save space.
                      </p>
                    </div>

                    <h3 className="text-lg font-bold mb-4">Step-by-Step Example (12.5 to Single Precision)</h3>
                    <div className="space-y-4 mb-8">
                      {[
                        { step: "1. Convert to Binary", desc: "12.5 in decimal is 1100.1 in binary." },
                        { step: "2. Normalize", desc: "1100.1 becomes 1.1001 × 2^3. The exponent is 3." },
                        { step: "3. Calculate Biased Exponent", desc: "3 + 127 = 130. In binary, 130 is 10000010." },
                        { step: "4. Extract Mantissa", desc: "The fractional part is 1001. Pad with zeros to 23 bits: 1001000..." },
                        { step: "5. Combine", desc: "Sign (0) + Exponent (10000010) + Mantissa (1001000...) = 0100000101001000..." }
                      ].map((ex, i) => (
                        <motion.div 
                          key={i}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-4"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{ex.step}</p>
                            <p className="text-xs text-slate-500">{ex.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Interactive Stories (Accordions) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Algorithm Knowledge Base</h2>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(ALGO_DETAILS).map(([key, detail]) => (
                      <motion.div 
                        key={key}
                        layout
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setExpandedStory(expandedStory === key ? null : key)}
                          className="w-full p-8 text-left flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-colors ${expandedStory === key ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-emerald-500'}`}>
                              {key === 'booth' || key === 'restoring' || key === 'non-restoring' ? <Cpu size={24} /> : <Calculator size={24} />}
                            </div>
                            <div>
                              <span className="block font-bold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors">{detail.title}</span>
                              <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Technical Deep Dive</span>
                            </div>
                          </div>
                          <ChevronRight 
                            size={24} 
                            className={`text-slate-300 transition-transform duration-300 ${expandedStory === key ? 'rotate-90 text-emerald-500' : ''}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {expandedStory === key && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-8 pb-8"
                            >
                              <div className="pt-6 border-t border-slate-50">
                                <div className="prose prose-slate max-w-none mb-8">
                                  <h4 className="text-sm font-mono text-emerald-600 uppercase tracking-widest mb-3">Theoretical Foundation</h4>
                                  <p className="text-slate-600 leading-relaxed">
                                    {detail.theory}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4">Core Principles</h4>
                                    <ul className="space-y-3">
                                      {detail.keyPoints.map((p, i) => (
                                        <li key={i} className="text-sm text-slate-600 flex items-start gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                          {p}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                                    <h4 className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest mb-4">Practical Implementation</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {detail.description}
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                      <Info size={14} /> Optimized for Hardware
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Historical Context & Stories</h2>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {STORIES.map((story) => (
                      <motion.div 
                        key={story.id}
                        layout
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                          className="w-full p-6 text-left flex items-center justify-between group"
                        >
                          <span className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{story.title}</span>
                          <ChevronRight 
                            size={20} 
                            className={`text-slate-300 transition-transform duration-300 ${expandedStory === story.id ? 'rotate-90 text-emerald-500' : ''}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {expandedStory === story.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-6 pb-6"
                            >
                              <div className="h-px bg-slate-100 mb-4" />
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {story.content}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <footer className="mt-20 py-12 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                  COA LAB Theory Module • Spandan2106
                </p>
              </footer>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Futuristic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 w-full">
              <header className="mb-12 md:mb-16 text-center">
                <div className="flex justify-between items-center mb-8">
                  <button 
                    onClick={() => setView('landing')}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                  >
                    <ArrowRight className="rotate-180" size={16} /> Home
                  </button>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border-emerald-200 text-emerald-700 border text-[10px] md:text-xs font-mono uppercase tracking-widest"
                  >
                    <Cpu size={14} />
                    Computer Organization & Architecture
                  </motion.div>
                  <button 
                    onClick={() => setView('theories')}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Theory <BookOpen size={16} />
                  </button>
                </div>
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-transparent mb-4"
                >
                  COA LAB
                </motion.h1>
                <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg px-4">
                  The ultimate playground for number systems, arithmetic, and hardware logic.
                </p>
              </header>

              {/* Controls & Description */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-5 md:p-6 rounded-3xl bg-white border-slate-200 shadow-xl border backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-sm font-mono text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <Calculator size={16} /> Configuration
                      </h2>
                      <button
                        onClick={handleClear}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <X size={12} /> Clear All
                      </button>
                    </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['booth', 'restoring', 'non-restoring', 'conversion', 'complement', 'arithmetic', 'ieee754'] as Algorithm[]).map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          setAlgo(a);
                          setResult(null);
                          if (a === 'ieee754') setVal1('12.5');
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-left flex items-center justify-between group ${
                          algo === a 
                            ? 'bg-emerald-500 text-black shadow-lg' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                        } border`}
                      >
                        <span className="capitalize">{a.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Inputs based on Algo */}
                <div className="space-y-4">
                  {(algo === 'conversion' || algo === 'complement') && (
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Base</label>
                      <select 
                        value={fromBase} 
                        onChange={(e) => setFromBase(parseInt(e.target.value) as Base)}
                        className="w-full bg-slate-100 border-slate-200 text-slate-900 border rounded-xl px-4 py-3 text-sm focus:outline-none"
                      >
                        <option value={2}>Binary (2)</option>
                        <option value={8}>Octal (8)</option>
                        <option value={10}>Decimal (10)</option>
                        <option value={16}>Hexadecimal (16)</option>
                      </select>
                    </div>
                  )}

                  {algo === 'conversion' && (
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Target Base</label>
                      <select 
                        value={toBase} 
                        onChange={(e) => setToBase(parseInt(e.target.value) as Base)}
                        className="w-full bg-slate-100 border-slate-200 text-slate-900 border rounded-xl px-4 py-3 text-sm focus:outline-none"
                      >
                        <option value={2}>Binary (2)</option>
                        <option value={8}>Octal (8)</option>
                        <option value={10}>Decimal (10)</option>
                        <option value={16}>Hexadecimal (16)</option>
                      </select>
                    </div>
                  )}

                  {algo === 'arithmetic' && (
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Operation</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setArithmeticOp('add')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${arithmeticOp === 'add' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                        >
                          Addition
                        </button>
                        <button
                          onClick={() => setArithmeticOp('multiply')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${arithmeticOp === 'multiply' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                        >
                          Multiplication
                        </button>
                      </div>
                    </div>
                  )}

                  {algo === 'ieee754' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Precision</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setIeeePrecision('single')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${ieeePrecision === 'single' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                          >
                            Single (32-bit)
                          </button>
                          <button
                            onClick={() => setIeeePrecision('double')}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${ieeePrecision === 'double' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                          >
                            Double (64-bit)
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Direction</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIeeeDirection('toIEEE');
                              setVal1('12.5');
                            }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${ieeeDirection === 'toIEEE' ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                          >
                            Decimal to IEEE
                          </button>
                          <button
                            onClick={() => {
                              setIeeeDirection('fromIEEE');
                              setVal1('41480000');
                            }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${ieeeDirection === 'fromIEEE' ? 'bg-emerald-500 text-black shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'} border`}
                          >
                            IEEE to Decimal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                        {algo === 'conversion' || algo === 'complement' ? 'Value' : (algo === 'booth' ? 'Multiplicand' : (algo === 'ieee754' ? (ieeeDirection === 'toIEEE' ? 'Decimal Value' : 'Hex/Binary Value') : 'Dividend'))}
                      </label>
                      <input
                        type="text"
                        value={val1}
                        onChange={(e) => setVal1(e.target.value)}
                        className="w-full bg-slate-100 border-slate-200 text-slate-900 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    {!(algo === 'conversion' || algo === 'complement' || algo === 'ieee754') && (
                      <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                          {algo === 'booth' ? 'Multiplier' : (algo === 'arithmetic' ? 'Value 2' : 'Divisor')}
                        </label>
                        <input
                          type="text"
                          value={val2}
                          onChange={(e) => setVal2(e.target.value)}
                          className="w-full bg-slate-100 border-slate-200 text-slate-900 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {(algo === 'restoring' || algo === 'non-restoring') && (parseInt(val1) < 0 || parseInt(val2) < 0) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2"
                    >
                      <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-tight">
                        <span className="font-bold">Note:</span> Division algorithms are for unsigned integers. Negative inputs will be treated as positive.
                      </p>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
                >
                  Process <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Link to Theory */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('theories')}
              className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <BookOpen size={80} />
              </div>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                Need Theory? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-emerald-50 leading-relaxed">
                Explore in-depth history, rules, and examples for {ALGO_DETAILS[algo].title} and more in our comprehensive Knowledge Base.
              </p>
            </motion.div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key={JSON.stringify(result)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 md:space-y-8"
                >
                  {/* Conversion / Complement Result */}
                  {result.type === 'conversion' && (
                    <div className="p-8 rounded-3xl bg-white border-slate-200 shadow-xl border backdrop-blur-xl text-center">
                      {result.isNegative && (
                        <p className="text-xs text-emerald-600/60 mb-4 font-mono">
                          Note: Processing negative input ({result.from})
                        </p>
                      )}
                      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">From Base {result.fromBase}</p>
                          <p className="text-4xl font-mono font-bold text-blue-500">{result.from}</p>
                        </div>
                        <ArrowRight size={32} className="text-slate-300" />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">To Base {result.toBase}</p>
                          <p className="text-4xl font-mono font-bold text-emerald-500">{result.to}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.type === 'complement' && (
                    <div className="p-8 rounded-3xl bg-white border-slate-200 shadow-xl border backdrop-blur-xl">
                      <h2 className="text-sm font-mono text-emerald-600 uppercase tracking-widest mb-4 text-center">Complement Analysis</h2>
                      <div className="text-center mb-8">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Input Value</p>
                        <p className="text-2xl font-mono font-bold text-slate-900">{result.value} (Base {result.base})</p>
                        <p className="text-xs text-slate-400 mt-1">Using {result.n} digits for calculation</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center p-6 rounded-2xl bg-blue-50 border border-blue-100">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 mb-2">({result.base - 1})'s Complement</p>
                          <p className="text-4xl font-mono font-bold text-blue-500">{result.r_minus_1}</p>
                          <p className="text-[10px] text-blue-400 mt-2">Diminished Radix</p>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 mb-2">{result.base}'s Complement</p>
                          <p className="text-4xl font-mono font-bold text-emerald-500">{result.r}</p>
                          <p className="text-[10px] text-emerald-400 mt-2">Radix Complement</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IEEE 754 Result */}
                  {(result.type === 'ieee754' || result.type === 'ieee754_reverse') && (
                    <div className="space-y-6">
                      <div className="p-8 rounded-3xl bg-white border-slate-200 shadow-xl border backdrop-blur-xl">
                        <h2 className="text-sm font-mono text-emerald-600 uppercase tracking-widest mb-6 text-center">IEEE 754 {result.precision} Precision</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Sign</p>
                            <p className="text-2xl font-mono font-bold text-red-500">{result.sign}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Exponent</p>
                            <p className="text-2xl font-mono font-bold text-blue-500">{result.exponent}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Mantissa</p>
                            <p className="text-xs font-mono font-bold text-emerald-500 break-all">{result.mantissa}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">Decimal Result</p>
                            <p className="text-3xl font-mono font-bold text-slate-900">{result.value}</p>
                          </div>
                          {result.hex && (
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                              <p className="text-[10px] uppercase tracking-wider text-blue-600 mb-1">Hexadecimal Representation</p>
                              <p className="text-2xl font-mono font-bold text-slate-900">{result.hex}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Steps for IEEE */}
                      <div className="p-6 md:p-8 rounded-3xl bg-white border-slate-200 shadow-xl border">
                        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6">Conversion Steps</h3>
                        <div className="space-y-6">
                          {result.steps.map((step: any, i: number) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400">
                                {i + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-1">{step.label}</h4>
                                <p className="text-lg font-mono text-emerald-600 mb-1 break-all">{step.value}</p>
                                {step.description && <p className="text-xs text-slate-500">{step.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Table for Algorithms */}
                  {result.steps && (
                    <div className="p-4 md:p-6 rounded-3xl bg-white border-slate-200 shadow-xl border backdrop-blur-xl overflow-hidden">
                      <h2 className="text-sm font-mono text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TableIcon size={16} /> Execution Trace
                      </h2>
                      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="border-b border-slate-200">
                              {Object.keys(result.steps[0]).map((key) => (
                                <th key={key} className="py-4 px-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.steps.map((step: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-emerald-500/5 transition-colors group">
                                {Object.values(step).map((val: any, i) => (
                                  <td key={i} className={`py-4 px-4 font-mono text-xs md:text-sm ${i === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Examination Guide */}
                  {result.n && (algo === 'booth' || algo === 'restoring' || algo === 'non-restoring' || algo === 'arithmetic') && (
                    <div className="p-6 md:p-8 rounded-3xl bg-emerald-50 border-emerald-200 shadow-md border">
                      <h2 className="text-lg md:text-xl font-bold mb-4">Examination Summary</h2>
                      <div className="space-y-4 text-slate-600">
                        <p className="text-sm">For the given inputs, the system used <span className="text-emerald-500 font-mono font-bold">{result.n} bits</span>.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="p-4 rounded-2xl bg-white border-slate-100 shadow-sm border">
                            <h4 className="text-[10px] font-mono uppercase text-slate-400 mb-2">Register Values</h4>
                            <ul className="space-y-2 text-xs md:text-sm font-mono">
                              {algo === 'booth' ? (
                                <>
                                  <li>BR: <span className="text-emerald-500">{result.br}</span></li>
                                  <li>QR: <span className="text-blue-500">{toBinary(parseInt(val2), result.n)}</span></li>
                                </>
                              ) : (
                                <>
                                  <li>M: <span className="text-emerald-500">{result.m}</span></li>
                                  <li>Q: <span className="text-blue-500">{toBinary(parseInt(val1), result.n)}</span></li>
                                </>
                              )}
                            </ul>
                          </div>
                          <div className="p-4 rounded-2xl bg-white border-slate-100 shadow-sm border">
                            <h4 className="text-[10px] font-mono uppercase text-slate-400 mb-2">Final Result</h4>
                            <div className="text-xl md:text-2xl font-bold text-emerald-500 font-mono">
                              {algo === 'booth' ? (
                                <span>Product: {parseInt(val1) * parseInt(val2)}</span>
                              ) : algo === 'arithmetic' ? (
                                <span>Result: {arithmeticOp === 'add' ? parseInt(val1) + parseInt(val2) : parseInt(val1) * parseInt(val2)}</span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm">Quotient: {result.quotient}</span>
                                  <span className="text-sm">Remainder: {result.remainder}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-3xl border-2 border-dashed border-slate-200 text-slate-300">
                  <Binary size={48} className="md:size-16 mb-4 opacity-20" />
                  <p className="text-lg md:text-xl font-medium">Ready for Logic Processing</p>
                  <p className="text-xs md:text-sm">Configure parameters and click "Process" to see the magic.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Flowcharts */}
        <section className="mt-16 md:mt-24">
          <div className="flex items-center gap-4 mb-8 md:mb-12">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-[10px] md:text-sm font-mono text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <ImageIcon size={16} /> Reference Flowcharts
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "Booth's Algorithm", src: boothImg },
              { title: "Restoring Division", src: restoringImg },
              { title: "Non-Restoring Division", src: nonRestoringImg, desc: "Optimized division without intermediate restoration." }
            ].map((flow, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl border p-4 bg-white border-slate-200 shadow-lg"
              >
                <div 
                  className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-50 mb-4 cursor-zoom-in group"
                  onClick={() => setZoomedImg(flow.src)}
                >
                  <img
                    src={flow.src}
                    alt={flow.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="text-white" size={32} />
                  </div>
                </div>
                <h3 className="font-bold text-base md:text-lg mb-1 text-slate-900">{flow.title}</h3>
                <p className="text-xs md:text-sm text-slate-500">{flow.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-xl"
            onClick={() => setZoomedImg(null)}
          >
            <button 
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              onClick={() => setZoomedImg(null)}
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedImg}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8 md:py-12 mt-16 md:mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] md:text-xs uppercase tracking-widest">
            <Cpu size={14} /> COA Lab
          </div>
          <div className="text-slate-300 text-[10px] md:text-xs text-center md:text-right">
            Designed for educational excellence in Computer Architecture. All rights reserved to Spandan2106.
          </div>
        </div>
      </footer>
    </motion.div>
  )}
</AnimatePresence>
</div>
);
}
