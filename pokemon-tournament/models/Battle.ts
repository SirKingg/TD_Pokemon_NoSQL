// models/Battle.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBattle extends Document {
  team1: {
    id: number;
    name: string;
    pokemons: Array<{
      pokedex_id: number;
      name: string;
      startingHp: number | null;
      remainingHp: number;
    }>;
  };
  team2: {
    id: number;
    name: string;
    pokemons: Array<{
      pokedex_id: number;
      name: string;
      startingHp: number | null;
      remainingHp: number;
    }>;
  };
  events: any[];
  matchWinner: string;
  teamWinner: string;
  createdAt: Date;
}

const BattleSchema: Schema = new Schema({
  team1: { type: Object, required: true },
  team2: { type: Object, required: true },
  events: { type: Array, required: true },
  matchWinner: { type: String, required: true },
  teamWinner: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Pour éviter le recompiling en mode développement, on vérifie si le modèle existe déjà.
export default (mongoose.models.Battle as Model<IBattle>) || mongoose.model<IBattle>('Battle', BattleSchema);
