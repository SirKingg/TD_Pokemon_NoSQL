'use client'
import { useState, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";

/*
  ---------------------------------------------------------------------
  Interface définissant la structure d'un Pokémon (selon la base de données)
  ---------------------------------------------------------------------
*/
interface PokemonType {
  _id: string;
  pokedex_id: number;
  generation: number;
  category: string;
  name: { fr: string; en: string; jp: string };
  sprites: { regular: string; shiny?: string; gmax?: any };
  types?: { name: string; image: string }[];
  stats?: {
    hp: number;
    atk: number;
    def: number;
    spe_atk: number;
    spe_def: number;
    vit: number;
  };
}

/*
  ---------------------------------------------------------------------
  Fonction fetcher pour SWR
  ---------------------------------------------------------------------
*/
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/*
  ---------------------------------------------------------------------
  Couleurs associées aux types (utilisées pour le fond des cartes Pokémon)
  ---------------------------------------------------------------------
*/
const typeColors: { [key: string]: string } = {
  Plante: "#78C850",
  Feu: "#F08030",
  Eau: "#6890F0",
  Insecte: "#A8B820",
  Normal: "#A8A878",
  Poison: "#A040A0",
  Vol: "#A890F0",
  Fée: "#EE99AC",
  Électrik: "#F8D030",
  Combat: "#C03028",
  Roche: "#B8A038",
  Glace: "#98D8D8",
  Psy: "#F85888",
  Ténèbres: "#705848",
  Spectre: "#705898",
  Acier: "#B8B8D0",
  Sol: "#E0C068",
  Dragon: "#7038F8",
};

/*
  ---------------------------------------------------------------------
  HeaderIndex : logo à gauche, titre centré, bouton d'accès à droite
  ---------------------------------------------------------------------
*/
function HeaderIndex() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md mb-4 w-full">
      <div>
        <img
          src="/pokemon-logo.png"
          alt="Pokemon Logo"
          className="w-50 h-20 object-contain select-none"
          draggable="false"
        />
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-3xl font-bold text-black">Pokédex</h1>
      </div>
      <div>
        <Link href="/tournament">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors">
            Accéder au Tournoi
          </button>
        </Link>
      </div>
    </header>
  );
}

/*
  ---------------------------------------------------------------------
  Composant Principal : Home (Pokédex)
  ---------------------------------------------------------------------
*/
export default function Home() {
  // Récupération des données via SWR
  const { data: pokemons, error } = useSWR<PokemonType[]>("/api/pokedex", fetcher);

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Filtrage des Pokémon (nom + type)
  const filteredPokemons = useMemo(() => {
    if (!pokemons) return [];
    return pokemons
      .filter((pokemon) => pokemon.name.fr !== "MissingNo.")
      .filter((pokemon) => {
        const matchesName = pokemon.name.fr
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesType = selectedType
          ? pokemon.types &&
            pokemon.types[0] &&
            pokemon.types[0].name.toLowerCase() === selectedType.toLowerCase()
          : true;
        return matchesName && matchesType;
      });
  }, [pokemons, searchTerm, selectedType]);

  // Récupération de tous les types disponibles
  const allTypes = useMemo(() => {
    const typesSet = new Set<string>();
    pokemons?.forEach((pokemon) => {
      if (pokemon.types && pokemon.types[0]?.name) {
        typesSet.add(pokemon.types[0].name);
      }
    });
    return Array.from(typesSet);
  }, [pokemons]);

  // Gestion des états de chargement et d'erreur
  if (error)
    return (
      <div className="text-center text-red-500 p-5 select-none">
        Erreur de chargement...
      </div>
    );
  if (!pokemons)
    return (
      <div className="text-center p-5 select-none">
        Chargement...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* Header identique à la page du tournoi : logo, titre, bouton */}
      <HeaderIndex />

      {/*
        ---------------------------------------------------------------------
        Zone de recherche : On conserve le champ de recherche + le select
        ---------------------------------------------------------------------
      */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-gray-100">
        <input
          type="text"
          placeholder="Rechercher un Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-4 rounded-lg border-2 border-red-600 w-72 text-base outline-none bg-white text-gray-800"
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-4 rounded-lg border-2 border-red-600 w-56 text-base outline-none bg-white text-gray-800"
        >
          <option value="">Tous les types</option>
          {allTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/*
        ---------------------------------------------------------------------
        Conteneur principal : On limite la zone d'affichage à 80% (w-4/5) 
        pour réduire la place et donc moins de Pokémon par ligne
        ---------------------------------------------------------------------
      */}
      <div className="flex-1 text-center text-gray-800 w-full px-5 py-5">
        <div className="mx-auto w-4/5"> 
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-[repeat(auto-fill,_minmax(220px,_1fr))] gap-6"
          >
            {filteredPokemons.map((pokemon) => {
              const pokemonType = pokemon.types?.[0]?.name;
              const bgGradient =
                pokemonType === "Roche"
                  ? `linear-gradient(45deg, ${typeColors[pokemonType]}80, #eee)`
                  : pokemonType
                  ? `linear-gradient(45deg, ${typeColors[pokemonType]}80, #fff)`
                  : "#fafafa";
              return (
                <motion.div
                  key={pokemon._id}
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center bg-white border-2 border-gray-400 rounded-xl p-5 shadow-lg select-none"
                  style={{ background: bgGradient }}
                >
                  <img
                    src={pokemon.sprites.regular}
                    alt={pokemon.name.fr}
                    draggable="false"
                    className="w-32 h-32 object-contain mb-4 select-none"
                  />
                  <h3 className="my-2 text-2xl text-red-600 text-center drop-shadow">
                    {pokemon.name.fr}
                  </h3>
                  <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {pokemon.types?.map((type) => (
                      <span
                        key={type.name}
                        className="px-3 py-1 rounded-full text-sm text-white border border-gray-600"
                        style={{ background: typeColors[type.name] || "#999" }}
                      >
                        {type.name}
                      </span>
                    ))}
                  </div>
                  {pokemon.stats && (
                    <div className="grid grid-cols-2 gap-2 text-lg w-full p-3 bg-gray-50 rounded-xl border border-gray-300">
                      <div>HP: {pokemon.stats.hp}</div>
                      <div>ATK: {pokemon.stats.atk}</div>
                      <div>DEF: {pokemon.stats.def}</div>
                      <div>VIT: {pokemon.stats.vit}</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <footer className="bg-gray-200 text-center py-2 text-gray-600 text-sm select-none">
        Coded and Designed by Thibaut Jacquemin &amp; Brice Volpi
      </footer>
    </div>
  );
}
