/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html", 
  ],
  theme: { extend: {
    colors: {
      primaryColor: '#335CFF',
      secondaryColor: "#8C8C8C"
      
    }
  } },
  plugins: [],
}