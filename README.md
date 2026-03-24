# COA LAB - Computer Organization & Architecture Visualizer

![Project Banner](public/Screenshot%202026-03-22%20192038.png)

**COA LAB** is a comprehensive educational visualization tool designed to help students and engineers understand the core concepts of Computer Organization and Architecture. It provides interactive visualizations for complex arithmetic algorithms, number system conversions, and binary logic.

## 🚀 Features

### 1. Arithmetic Algorithms
Visualize step-by-step execution of hardware algorithms:
- **Booth's Algorithm**: Signed multiplication using 2's complement.
- **Restoring Division**: Standard unsigned division algorithm.
- **Non-Restoring Division**: Optimized division without the restoration step.

### 2. Number Systems
- **Base Conversion**: Convert between Binary (2), Octal (8), Decimal (10), and Hexadecimal (16).
- **Step-by-Step Trace**: See the division/multiplication steps required for conversion.
- **Complements**: Calculate r's (Radix) and (r-1)'s (Diminished Radix) complements for any base.

### 3. Binary Arithmetic
- Perform direct Binary Addition and Multiplication.
- View detailed traces of the operation including carry bits and overflow.

### 4. Knowledge Base
- Interactive stories explaining the history and significance of various number systems.
- Differences between Computer Architecture and Organization.
- Reference flowcharts for standard algorithms (Booth's, Restoring, etc.).

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript)
- **Styling**: Tailwind CSS
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Build Tool**: Vite (Recommended)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/coa-visualizer.git
   cd coa-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Select an Algorithm**: Use the configuration panel on the left to choose between Booth's, Division, Conversion, etc.
2. **Input Values**: Enter your operands (Multiplicand/Multiplier or Dividend/Divisor) or the number to convert.
   - *Note*: For Booth's algorithm, signed integers are supported.
3. **Process**: Click the **Process** button to generate the result.
4. **Analyze**: 
   - View the final result cards.
   - Inspect the **Execution Trace** table to see the register values (Accumulator, Q, M) change at every step.

## 📂 Project Structure

- `src/App.tsx`: Main application logic and UI layout.
- `src/algorithms/`: Implementation of core COA algorithms (Booth, Restoring, etc.).
- `src/utils/`: Binary arithmetic and helper utilities.
- `public/`: Static assets and reference flowcharts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.
