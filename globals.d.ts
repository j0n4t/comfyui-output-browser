type CFOB_Image = {
  name: string;
  url: string;
  prompt: Record<string, any> | null;
  workflow: Record<string, any> | null;
  isParsed: boolean;
  isParsing?: boolean;
};

type CFOB_CardFieldSettings = {
  label: string;
  paths: string;
};
