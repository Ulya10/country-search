export interface RawCountry {
  name: string;
  alpha2Code: string;
  alpha3Code: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  languages: Array<{ iso639_1: string; name: string }>;
  callingCodes: string[];
  topLevelDomain: string[];
  borders: string[];
  flag: string;
}

export interface Country {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  borders: string[];
  languages: string[];
  currencies: Array<{ name: string; symbol: string }>;
}
