type CFOB_Image = {
  name: string;
  mtime: number;
  url: string;
  prompt: Record<string, any> | null;
  workflow: Record<string, any> | null;
  textChunks: Record<string, string> | null;
  isParsed: boolean;
  isParsing?: boolean;
};

type CFOB_CardFieldSettings = {
  label: string;
  paths: string;
};

type CFOB_LauncherPlacementModes =
  | "switch"
  | "sidebar"
  | "action-bar"
  | "floating"
  | "hook";
