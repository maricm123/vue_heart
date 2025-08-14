import { definePreset } from "@primevue/themes";
import Material from "@primevue/themes/material";

export const HeartPreset = definePreset(Material, {
  css: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "16px",
    fontWeight: "400"
  },
  semantic: {
    primary: {
      DEFAULT: "#E63946", // Crvena (brand)
      50: "#FDEAEA",
      100: "#FACDCD",
      200: "#F6A9A9",
      300: "#F28484",
      400: "#EE5F5F",
      500: "#E63946",
      600: "#B22234",
      700: "#8C1A26",
      800: "#661319",
      900: "#400C0D",
      950: "#200607",
    },
    secondary: {
      DEFAULT: "#06D6A0", // Tirkiz
      50: "#E1FBF4",
      100: "#B3F5E1",
      200: "#80EECF",
      300: "#4DE7BC",
      400: "#26E1AD",
      500: "#06D6A0",
      600: "#05AA80",
      700: "#047F60",
      800: "#035440",
      900: "#012A20",
      950: "#001410",
    },
    success: {
      DEFAULT: "#06D6A0",
    },
    warning: {
      DEFAULT: "#F4A261", // Narandžasta
    },
    info: {
      DEFAULT: "#118AB2", // Plava
    },
    surface: {
      0: "#FFFFFF", // bela
      50: "#F8F9FA", // svetlosiva pozadina
      900: "#343A40", // tamnosiva tekst
    },
  },
});