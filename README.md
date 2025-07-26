# R6 Operator Randomizer 🎲

A sleek, customizable Rainbow Six Siege Operator Randomizer UI for local or GitHub Pages use. Built with **React** and **Vite**, this app lets players randomize operators with style — and control.

## 🔧 Features

- 🎯 **Weighted Randomization**  
  Each operator has a weight (starting at 10). Weights increase if not picked, and decrease if picked, encouraging fair and dynamic selections.

- 🔀 **Reroll System**
    - Reroll a single operator without affecting others.
    - Locked operators remain during rerolls.
    - Played operators are removed with a stylish green fade-out.

- 🧩 **Operator Grid Toggle**
    - Enable/disable operators in the grid to exclude them from randomization.
    - Automatically rerolls if a selected operator is disabled.

- 🛠️ **State Persistence**
    - Save/load disabled operators and weights using localStorage.
    - Reset to default with a single click.

- 🧠 **Smart Rerolling**  
  Ensures no duplicates and respects locked operators.

- 🎨 **UI & UX**
    - Tooltip hover for operator names and buttons
    - Color-coded state borders:
        - 🟡 Gold for **Locked**
        - 🔵 Blue for **Rerolled**
        - 🟢 Green for **Played**
    - 7-wide grid layout with large, readable icons

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/r6-randomizer.git
cd r6-randomizer
```
### 2. Install dependencies
```bash
npm install
```
### 3. Start development server
```bash
npm run dev
```
Open http://localhost:5173 to view it in the browser.

## 🚀 Deployment (GitHub Pages)

### GitHub Pages config (Vite)
```js
export default defineConfig({
    plugins: [react()],
    base: '/r6-randomizer/',
});
```

### Deploy manually
```bash
npm run deploy
```

## 📁 Folder Structure
```bash
r6-randomizer/
│
├── public/
│   └── images/operators/    # Operator icons (.png)
│
├── src/
│   ├── OperatorRandomizerUI.jsx  # Main component
│   └── App.css                   # UI styles
│
├── package.json
├── vite.config.js
└── README.md
```

## 🧠 Operator Logic
Locked operators stay during reroll.

Played operators are removed after selection (with green highlight).

Disabled operators are grayed out and excluded.

Weights affect likelihood of selection:

+1 if not picked

−1 if picked

## 🙏 Credits
Created with 💻 by [RuKira](https://github.com/RuKira)

Assisted by [ChatGPT](https://openai.com/chatgpt) — for code structuring, debugging, and feature brainstorming.