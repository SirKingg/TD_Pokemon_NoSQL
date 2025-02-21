import mongoose, { Document, Model } from 'mongoose';

export interface IPokemon extends Document {
  pokedex_id: number;
  generation: number;
  category: string;
  name: {
    fr: string;
    en: string;
    jp: string;
  };
  sprites: {
    regular: string;
    shiny?: string;
    gmax?: any;
  };
  types?: {
    name: string;
    image: string;
  }[];
  stats?: {
    hp: number;
    atk: number;
    def: number;
    spe_atk: number;
    spe_def: number;
    vit: number;
  };
}

const PokemonSchema = new mongoose.Schema<IPokemon>(
  {
    pokedex_id: Number,
    generation: Number,
    category: String,
    name: {
      fr: String,
      en: String,
      jp: String,
    },
    sprites: {
      regular: String,
      shiny: String,
      gmax: mongoose.Schema.Types.Mixed,
    },
    types: [
      {
        name: String,
        image: String,
      },
    ],
    stats: {
      hp: Number,
      atk: Number,
      def: Number,
      spe_atk: Number,
      spe_def: Number,
      vit: Number,
    },
  },
  { collection: 'pokedex' } // Forcer l'utilisation de la collection "pokedex"
);

export default mongoose.models.Pokemon as Model<IPokemon> || mongoose.model<IPokemon>('Pokemon', PokemonSchema);
