// This file helps TypeScript understand how to resolve imports without extensions
declare module "*" {
  const value: any;
  export default value;
}

declare module "../../components/HapticTab" {
  import { HapticTab } from "../../components/HapticTab";
  export { HapticTab };
}

declare module "../../components/ui/IconSymbol" {
  import { IconSymbol } from "../../components/ui/IconSymbol";
  export { IconSymbol };
}

declare module "../../components/ui/TabBarBackground" {
  import TabBarBackground from "../../components/ui/TabBarBackground";
  export default TabBarBackground;
}

declare module "../../constants/Colors" {
  import { Colors } from "../../constants/Colors";
  export { Colors };
}

declare module "../../hooks/useColorScheme" {
  import { useColorScheme } from "../../hooks/useColorScheme";
  export { useColorScheme };
}
