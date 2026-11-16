import { gql } from '@apollo/client';

export const MICROCHIP_SEARCH_QUERY = gql`
  query MicrochipSearch($input: MicrochipSearchInput!) {
    microchipSearch(input: $input) {
      microchip
      matches {
        petId
        name
        species
        breed
        hasAccess
      }
    }
  }
`;

export const NOTIFY_OWNER_ABOUT_FOUND_PET_MUTATION = gql`
  mutation NotifyOwnerAboutFoundPet($input: NotifyOwnerAboutFoundPetInput!) {
    notifyOwnerAboutFoundPet(input: $input)
  }
`;

export type MicrochipMatch = {
  petId: string;
  name: string;
  species: string;
  breed?: string | null;
  hasAccess: boolean;
};

export type MicrochipSearchResult = {
  microchipSearch: { microchip: string; matches: MicrochipMatch[] };
};

/** Same rule as the API: 9–15 letters or digits once separators are removed. */
export function isPlausibleMicrochip(value: string): boolean {
  return /^[0-9A-Z]{9,15}$/.test(value.replace(/[\s.\-_/]+/g, '').toUpperCase());
}
