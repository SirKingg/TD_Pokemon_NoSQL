'use client'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bracket } from 'react-brackets';
import Link from 'next/link';

/*
  ---------------------------------------------------------------------
  Constantes globales
  ---------------------------------------------------------------------
*/
const ROUND_DELAY = 100;
const BATTLE_DELAY = 50;
const ATTACK_DELAY = 50;
const MAX_ROUNDS = 9999;

/*
  ---------------------------------------------------------------------
  Helper : retourne le libellé du round
  ---------------------------------------------------------------------
*/
function getRoundLabel(round: number): string {
  switch (round) {
    case 1:
      return '1/16 Finale';
    case 2:
      return '1/8 Finale';
    case 3:
      return 'Quart Finale';
    case 4:
      return 'Demi Finale';
    case 5:
      return 'Finale';
    default:
      return `Round ${round}`;
  }
}

/*
  ---------------------------------------------------------------------
  VictoryPokemonCard : affiche l'image, le nom et les HP du Pokémon.
         Utilise la classe CSS .gradient-winner pour le dégradé.
  ---------------------------------------------------------------------
*/
const VictoryPokemonCard = ({ pokemon }: { pokemon: any }) => (
  <div
    className="flex flex-col items-center m-1 p-2 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow select-none gradient-winner"
  >
    {pokemon.sprites?.regular && (
      <img
        src={pokemon.sprites.regular}
        alt={pokemon.name.fr}
        className="w-12 h-12 object-contain mb-1 select-none"
        draggable="false"
      />
    )}
    <h3 className="text-xs font-bold text-gray-800 mb-0.5">{pokemon.name.fr}</h3>
    <p className="text-xs text-gray-600">
      HP: {pokemon.stats ? pokemon.stats.hp : pokemon.currentHp}
    </p>
  </div>
);

/*
  ---------------------------------------------------------------------
  Interfaces utilisées
  ---------------------------------------------------------------------
*/
interface Pokemon {
  pokedex_id: number;
  generation?: number;
  category?: string;
  name: { en: string; fr: string; jp: string };
  sprites?: { regular: string; shiny?: string; gmax?: any };
  types?: Array<{ name: string; image: string }>;
  stats: { hp: number; atk: number; def: number; vit: number; spe_atk?: number; spe_def?: number } | null;
}

interface Team {
  id: number;
  name: string;
  pokemons: (Pokemon & { currentHp: number })[];
}

interface BattleLog {
  text: string;
  highlight: boolean;
  team1?: string;
  team2?: string;
  pokemon1?: string;
  pokemon2?: string;
}

/*
  ---------------------------------------------------------------------
  Header commun pour la page Tournament :
         - Logo en haut à gauche
         - Titre "Tournoi Pokémon" centré
         - Bouton "Retour au Pokédex" à droite
  ---------------------------------------------------------------------
*/
function HeaderTournament() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md select-none w-full">
      <div>
        <img
          src="/pokemon-logo.png"
          alt="Pokemon Logo"
          className="w-50 h-20 object-contain select-none"
          draggable="false"
        />
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-3xl font-bold text-black">Tournoi Pokémon</h1>
      </div>
      <div>
        <Link href="/">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors">
            Retour au Pokédex
          </button>
        </Link>
      </div>
    </header>
  );
}

/*
  ---------------------------------------------------------------------
  Composant Principal : TournamentPage
         Gère la simulation du tournoi, l'affichage du bracket et des logs.
         La musique reste persistante via _app.tsx.
  ---------------------------------------------------------------------
*/
export default function TournamentPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'simulating' | 'completed'>('loading');
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [hoveredTeam, setHoveredTeam] = useState<Team | null>(null);
  const [tournamentWinner, setTournamentWinner] = useState<Team | null>(null);
  const [tournamentBracket, setTournamentBracket] = useState<
    { round: number; matches: { team1: Team; team2: Team; winner?: Team }[] }[]
  >([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentMatch, setCurrentMatch] = useState(0);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchPokemons();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // ---------------------------------------------------------------------
  // Récupération des Pokémon depuis l'API
  // ---------------------------------------------------------------------
  const fetchPokemons = async () => {
    try {
      const res = await fetch('/api/pokedex');
      if (!res.ok) throw new Error('Failed to fetch pokedex data');
      const pokemons: Pokemon[] = await res.json();
      generateTeams(pokemons);
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, { text: 'Erreur lors du chargement des données', highlight: true }]);
      setStatus('completed');
    }
  };

  // ---------------------------------------------------------------------
  // Génération de 32 équipes de 6 Pokémon chacune
  // ---------------------------------------------------------------------
  const generateTeams = (pokemons: Pokemon[]) => {
    const validPokemons = pokemons.filter(p => p.stats && p.stats.hp > 0);
    if (validPokemons.length < 32 * 6) {
      setLogs(prev => [
        ...prev,
        { text: 'Pas assez de Pokémon avec des stats valides pour générer 32 équipes.', highlight: true }
      ]);
      setStatus('completed');
      return;
    }
    const shuffled = [...validPokemons];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const teamsArray: Team[] = [];
    for (let i = 0; i < 32; i++) {
      const teamPokemon = shuffled.slice(i * 6, i * 6 + 6).map(p => ({
        ...p,
        currentHp: p.stats!.hp
      }));
      teamsArray.push({ id: i + 1, name: `Équipe ${i + 1}`, pokemons: teamPokemon });
    }
    setTeams(teamsArray);
    setStatus('simulating');
    simulateTournament(teamsArray);
  };

  // ---------------------------------------------------------------------
  // Enregistrement des données de combat dans la collection "battles"
  // ---------------------------------------------------------------------
  const recordBattle = async (battleData: any) => {
    try {
      await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(battleData)
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du combat:', error);
    }
  };

  // ---------------------------------------------------------------------
  // Simulation du tournoi
  // ---------------------------------------------------------------------
  const simulateTournament = async (teamsArray: Team[]) => {
    let roundTeams = [...teamsArray];
    let round = 1;
    const bracket: { round: number; matches: { team1: Team; team2: Team; winner?: Team }[] }[] = [];

    while (roundTeams.length > 1) {
      setCurrentRound(round);
      setLogs(prev => [...prev, { text: `--- ROUND ${round} ---`, highlight: true }]);
      const matches: { team1: Team; team2: Team; winner?: Team }[] = [];
      const nextRoundTeams: Team[] = [];

      for (let i = 0; i < roundTeams.length; i += 2) {
        const team1 = roundTeams[i];
        const team2 = roundTeams[i + 1];
        matches.push({ team1, team2 });
      }

      bracket.push({ round, matches: [...matches] });
      setTournamentBracket([...bracket]);

      for (let i = 0; i < matches.length; i++) {
        setCurrentMatch(i);
        const match = matches[i];
        const battleLog = await simulateBattle(match.team1, match.team2);
        battleLog.forEach(eventLog => setLogs(prev => [...prev, eventLog]));
        const lastMessage = battleLog[battleLog.length - 1].text;
        const winnerName = lastMessage.split(' remporte ')[0];
        const winner = winnerName === match.team1.name ? match.team1 : match.team2;

        // Réinitialisation des HP de l'équipe gagnante
        winner.pokemons.forEach(p => {
          if (p.stats) p.currentHp = p.stats.hp;
        });

        matches[i].winner = winner;
        setTournamentBracket([...bracket]);
        nextRoundTeams.push(winner);
        await new Promise(resolve => setTimeout(resolve, BATTLE_DELAY));
      }

      roundTeams = nextRoundTeams;
      round++;
      await new Promise(resolve => setTimeout(resolve, ROUND_DELAY));
    }

    setTournamentWinner(roundTeams[0]);
    setLogs(prev => [
      ...prev,
      { text: `🏆 VAINQUEUR DU TOURNOI: ${roundTeams[0].name} 🏆`, highlight: true }
    ]);
    setStatus('completed');
  };

  // ---------------------------------------------------------------------
  // Simulation d'un combat 1vs1 entre deux équipes
  // ---------------------------------------------------------------------
  const simulateBattle = async (team1: Team, team2: Team): Promise<BattleLog[]> => {
    const battleLogs: BattleLog[] = [];
    const battleEvents: any[] = [];
    const team1Pokemons = team1.pokemons.map(p => ({ ...p }));
    const team2Pokemons = team2.pokemons.map(p => ({ ...p }));

    battleLogs.push({
      text: `⚔️ ${team1.name} affronte ${team2.name} ⚔️`,
      highlight: true,
      team1: team1.name,
      team2: team2.name
    });

    await new Promise(resolve => setTimeout(resolve, ATTACK_DELAY));
    let roundCounter = 0;

    while (
      team1Pokemons.some(p => p.currentHp > 0) &&
      team2Pokemons.some(p => p.currentHp > 0) &&
      roundCounter < MAX_ROUNDS
    ) {
      roundCounter++;
      const alive1 = team1Pokemons.filter(p => p.currentHp > 0);
      const alive2 = team2Pokemons.filter(p => p.currentHp > 0);
      const p1 = alive1[Math.floor(Math.random() * alive1.length)];
      const p2 = alive2[Math.floor(Math.random() * alive2.length)];
      const firstGoesP1 =
        p1.stats!.vit > p2.stats!.vit ||
        (p1.stats!.vit === p2.stats!.vit && Math.random() < 0.5);
      const [attacker, defender, attackerTeam, defenderTeam] = firstGoesP1
        ? [p1, p2, team1, team2]
        : [p2, p1, team2, team1];

      const criticalHitChance = 0.1;
      const criticalHit = Math.random() < criticalHitChance;
      let damage = Math.max(1, Math.floor(attacker.stats!.atk * (criticalHit ? 1.5 : 1)));
      const defenseReduction = defender.stats!.def / 100;
      damage = Math.max(1, Math.floor(damage * (1 - defenseReduction)));
      defender.currentHp = Math.max(0, defender.currentHp - damage);

      battleEvents.push({
        type: 'attack',
        attacker: attacker.name.fr,
        defender: defender.name.fr,
        damage,
        critical: criticalHit
      });

      let attackMessage = `${attacker.name.fr} (${attackerTeam.name}) attaque ${defender.name.fr}`;
      if (criticalHit) attackMessage += ' 💥 Coup critique!';
      attackMessage += ` et inflige ${damage} dégâts.`;
      battleLogs.push({
        text: attackMessage,
        highlight: false,
        team1: attackerTeam.name,
        team2: defenderTeam.name,
        pokemon1: attacker.name.fr,
        pokemon2: defender.name.fr
      });

      await new Promise(resolve => setTimeout(resolve, ATTACK_DELAY));

      if (defender.currentHp <= 0) {
        battleLogs.push({ text: `${defender.name.fr} est K.O. !`, highlight: false });
        battleEvents.push({ type: 'KO', pokemon: defender.name.fr, remainingHp: defender.currentHp });
        await new Promise(resolve => setTimeout(resolve, ATTACK_DELAY));
        continue;
      }

      let counterDamage = Math.max(
        1,
        Math.floor(defender.stats!.atk * (Math.random() < criticalHitChance ? 1.5 : 1))
      );
      const attackerDefReduction = attacker.stats!.def / 100;
      counterDamage = Math.max(1, Math.floor(counterDamage * (1 - attackerDefReduction)));
      attacker.currentHp = Math.max(0, attacker.currentHp - counterDamage);

      battleEvents.push({
        type: 'counter',
        attacker: defender.name.fr,
        defender: attacker.name.fr,
        damage: counterDamage,
        critical: false
      });

      let counterMessage = `${defender.name.fr} riposte et inflige ${counterDamage} dégâts.`;
      battleLogs.push({ text: counterMessage, highlight: false });
      await new Promise(resolve => setTimeout(resolve, ATTACK_DELAY));

      if (attacker.currentHp <= 0) {
        battleLogs.push({ text: `${attacker.name.fr} est K.O. !`, highlight: false });
        battleEvents.push({ type: 'KO', pokemon: attacker.name.fr, remainingHp: attacker.currentHp });
        await new Promise(resolve => setTimeout(resolve, ATTACK_DELAY));
      }
    }

    let winner: string;
    if (roundCounter >= MAX_ROUNDS) {
      const team1HP = team1Pokemons.reduce((sum, p) => sum + p.currentHp, 0);
      const team2HP = team2Pokemons.reduce((sum, p) => sum + p.currentHp, 0);
      winner = team1HP > team2HP ? team1.name : team2.name;
      battleLogs.push({
        text: `Limite de tours atteinte! ${winner} l’emporte aux points de vie.`,
        highlight: false
      });
    } else {
      winner = team1Pokemons.some(p => p.currentHp > 0) ? team1.name : team2.name;
    }
    battleLogs.push({ text: `${winner} remporte le combat!`, highlight: true });

    const battleData = {
      team1: {
        id: team1.id,
        name: team1.name,
        pokemons: team1Pokemons.map(p => ({
          pokedex_id: p.pokedex_id,
          name: p.name.fr,
          startingHp: p.stats ? p.stats.hp : null,
          remainingHp: p.currentHp
        }))
      },
      team2: {
        id: team2.id,
        name: team2.name,
        pokemons: team2Pokemons.map(p => ({
          pokedex_id: p.pokedex_id,
          name: p.name.fr,
          startingHp: p.stats ? p.stats.hp : null,
          remainingHp: p.currentHp
        }))
      },
      events: battleEvents,
      matchWinner: winner,
      teamWinner: winner
    };
    recordBattle(battleData);
    return battleLogs;
  };

  // ---------------------------------------------------------------------
  // Mapping du bracket pour react-brackets
  // ---------------------------------------------------------------------
  const mappedRounds = tournamentBracket.map(roundData => ({
    title: getRoundLabel(roundData.round),
    seeds: roundData.matches.map((match, idx) => ({
      id: `${roundData.round}-${idx}`,
      teams: [{ name: match.team1.name }, { name: match.team2.name }]
    }))
  }));

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* ---------------------------------------------------------------------
           Header : logo en haut à gauche, titre centré, bouton de retour à droite
           --------------------------------------------------------------------- */}
      <HeaderTournament />

      <div className="flex-1 w-11/12 mx-auto p-5 text-center text-gray-800">
        {status === 'loading' && (
          <div className="py-10 text-xl">Chargement des données...</div>
        )}

        {status !== 'loading' && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
            {/* ---------------------------------------------------------------------
                 Colonne gauche : Bracket et Historique des combats
                 --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-lg p-5 shadow-md">
                <h2 className="text-lg font-bold mb-3">
                  Arbre du Tournoi {status === 'simulating' && `(ROUND ${currentRound})`}
                </h2>
                {mappedRounds.length > 0 && (
                  <div className="w-full overflow-x-auto mx-auto" style={{ maxWidth: '1200px' }}>
                    <Bracket rounds={mappedRounds} />
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg p-5 shadow-md">
                <h3 className="font-bold mb-2">Historique des Combats</h3>
                <div
                  ref={logContainerRef}
                  className="max-h-64 overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50 text-left text-sm"
                >
                  <AnimatePresence initial={false}>
                    {logs.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`my-1 p-1 rounded ${log.highlight ? 'bg-blue-100 font-bold' : ''}`}
                      >
                        {log.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {/* ---------------------------------------------------------------------
                 Colonne droite : Vainqueur et Équipes Participantes
                 --------------------------------------------------------------------- */}
            <div className="flex flex-col gap-5 w-72">
              {tournamentWinner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-lg p-4 text-center shadow-md select-none gradient-winner"
                >
                  <h2 className="text-base font-bold mb-2">🏆 VAINQUEUR DU TOURNOI 🏆</h2>
                  <div className="text-sm mb-2">{tournamentWinner.name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {tournamentWinner.pokemons.map(pokemon => (
                      <VictoryPokemonCard key={pokemon.pokedex_id} pokemon={pokemon} />
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-bold mb-2">Équipes Participantes</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      className={`p-1 border rounded text-center cursor-default ${
                        tournamentWinner?.id === team.id ? 'bg-yellow-100 font-bold' : 'bg-transparent'
                      }`}
                      onMouseEnter={() => setHoveredTeam(team)}
                      onMouseLeave={() => setHoveredTeam(null)}
                    >
                      {team.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-gray-200 text-center py-2 text-gray-600 text-sm select-none">
        Coded and Designed by Thibaut Jacquemin &amp; Brice Volpi
      </footer>

      <AnimatePresence>
        {hoveredTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 bg-white border border-gray-300 shadow-lg rounded-lg p-3 z-50 max-w-xs text-black select-none"
          >
            <h4 className="text-sm font-bold mb-1">{hoveredTeam.name}</h4>
            <div className="grid grid-cols-3 gap-1">
              {hoveredTeam.pokemons.map(pokemon => (
                <div key={pokemon.pokedex_id} className="flex flex-col items-center gap-1 p-1">
                  {pokemon.sprites?.regular && (
                    <img
                      src={pokemon.sprites.regular}
                      alt={pokemon.name.fr}
                      className="w-8 h-8 object-contain select-none"
                      draggable="false"
                    />
                  )}
                  <span className="text-xs">{pokemon.name.fr}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
