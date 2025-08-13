import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/material";

export const PilatesPreset = definePreset(Aura, {
  semantic: {
    primary: {
      DEFAULT: "#04b2be",
      50: "#E0F7F9",
      100: "#B3EDF0",
      200: "#80E2E7",
      300: "#4DD8DE",
      400: "#26CCD6",
      500: "#04b2be",
      600: "#038D96",
      700: "#02686E",
      800: "#014347",
      900: "#001E20",
      950: "#000F10",
    },
  },
});
