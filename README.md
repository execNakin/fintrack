
# 🚀 FinTrack - Your Private, AI-Powered Financial Tracker


**FinTrack** is a modern, privacy-first personal finance application designed to help you effortlessly track your income, expenses, and investments. It leverages the power of the Google Gemini AI to provide smart features like natural language expense entry and personalized financial analysis, all while ensuring your data remains completely private and stored only on your device.

**Languages:** 🇬🇧 English | 🇹🇭 ภาษาไทย

---

## ✨ Core Features

*   🔐 **100% Private & Offline-First**: All your financial data is stored directly in your browser's Local Storage. No data is ever sent to a server without your explicit action (e.g., using an AI feature).
*   🤖 **AI Quick Add**: Add expenses using simple, natural language. Just type `"Starbucks coffee 85 baht"` and let the AI categorize and record it for you.
*   📊 **Comprehensive Dashboard**: Get a complete overview of your finances at a glance, including your balance, income, expenses, and investment portfolio value.
*   📈 **Investment Tracking**: Monitor your stocks and cryptocurrency portfolio. Use AI to fetch the latest market prices for your assets and automatically log transactions when you buy or sell.
*   🎯 **Smart Budgeting**: Set monthly budgets for different categories. Receive intelligent alerts when you're approaching your limit.
*   🚨 **"Hard Mode" for Budgets**: For ultimate discipline, enable Hard Mode to block any transaction that would push you over budget.
*   🔁 **Recurring Transactions**: Automate your finances by setting up recurring entries for bills, salaries, or regular savings.
*   💡 **AI Financial Analysis**: With a click of a button, "Fin-Bot" analyzes your transaction history to provide personalized insights, identify spending trends, and offer actionable savings tips.
*   🌐 **Multi-Language Support**: Fully localized interface available in both English and Thai.
*   📦 **Data Portability**: Easily export all your data to a JSON file for backup or import it to restore your records.

---

## 🛠️ Tech Stack

*   **Framework**: React (with TypeScript)
*   **AI Engine**: Google Gemini API (`@google/genai`)
*   **Styling**: Tailwind CSS
*   **State Management**: React Context API with a custom `useLocalStorage` hook
*   **Routing**: React Router
*   **Charting**: Recharts
*   **Animations**: Framer Motion
*   **Icons**: Lucide React

---

## 🏃‍♀️ Getting Started

This is a client-side web application. To run or use it, you need a web browser and an API key for the Google Gemini API.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Safari, Edge).
*   A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Usage

1.  **Set up the API Key**: The application expects the Google Gemini API key to be available as `process.env.API_KEY`. In a real-world deployment on platforms like Vercel or Netlify, you would set this as an environment variable in the project settings. For local development, a tool like `vite` would handle this.
2.  **Open the App**: Simply open the `index.html` file in your browser or deploy the project folder to a static web host.
3.  **Start Tracking**: Begin by adding your transactions, setting up budgets, or adding investments. All data will be saved automatically to your browser.

---

## 📂 Project Structure

```
/
├── components/         # Reusable React components (Modals, etc.)
├── contexts/           # React Context for global state (Data, Locale)
├── hooks/              # Custom React hooks (useLocalStorage)
├── locales/            # JSON files for internationalization (i18n)
├── pages/              # Main page components for each route
├── App.tsx             # Main app component with routing logic
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── index.html          # The main HTML file
└── README.md           # You are here!
```
The ai function still not working im trying to fix it soon
---

## 📄 License

Please dont sell my shit
