import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../lib/dbConnect";
import Pokemon from "../../models/Pokemon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Tentative de connexion à la base de données...");
    await dbConnect();
    console.log("Connexion réussie.");

    const pokemons = await Pokemon.find({});
    console.log(`Documents trouvés dans la collection: ${pokemons.length}`);
    
    // Affichez quelques données pour vérifier le contenu
    if (pokemons.length > 0) {
      console.log("Premier document:", pokemons[0]);
    } else {
      console.log("Aucun document trouvé dans la collection.");
    }
    
    res.status(200).json(pokemons);
  } catch (error: any) {
    console.error("Erreur dans /api/pokedex:", error);
    res.status(500).json({ error: error.message });
  }
}
