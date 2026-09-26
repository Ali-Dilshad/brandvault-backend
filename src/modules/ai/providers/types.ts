export interface AiSuggestionInput {
  assetName: string;
  assetType: string;
  assetUrl: string;
  folderName?: string | null;
  brand?: { name: string; primaryColor: string; secondaryColor: string } | null;
}


export interface AiProvider {
  name: string;
  generate(input: AiSuggestionInput): Promise<unknown>;
}
