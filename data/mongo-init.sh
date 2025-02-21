#!/bin/bash
# Utilisation de mongosh pour initialiser la base "pokemon" et importer les données dans la collection "pokedex"

mongosh <<EOF
use pokemon
// Création des collections si elles n'existent pas déjà
try { db.createCollection("pokedex") } catch(e) { }
try { db.createCollection("teams") } catch(e) { }
try { db.createCollection("battles") } catch(e) { }

// Lecture du fichier JSON et insertion dans la collection "pokedex"
var data = cat("/docker-entrypoint-initdb.d/pokemon.json");
if (typeof data === "string") {
  var jsonData = JSON.parse(data);
  db.pokedex.insertMany(jsonData);
} else {
  print("Erreur: le fichier JSON n'a pas pu être lu.");
}
EOF
