import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        papier: "#FDFBF7",
        ivoire: "#FFFFFF",
        encre: "#1B4332",
        argile: "#52796F",
        sauge: "#10B981",
        ciel: "#ECFDF5",
        miel: "#D97706",
        brun: "#52796F",
        danger: "#C0392B"
      },
      boxShadow: {
        doux: "0 18px 45px rgba(27, 67, 50, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;