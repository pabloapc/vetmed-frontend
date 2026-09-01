/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            backgroundOpacity: ["active"],
            backgroundOpacity: {
                10: "0.1",
                50: "0.5",
                95: "0.95",
            },
        },
    },
    plugins: [],
};
