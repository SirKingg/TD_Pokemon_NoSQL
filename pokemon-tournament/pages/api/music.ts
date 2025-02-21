import type { NextApiRequest, NextApiResponse } from 'next';
import { readdirSync } from 'fs';
import { join } from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const musicDir = join(process.cwd(), 'public', 'musiques');
    const files = readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    res.status(200).json(files);
  } catch (error) {
    console.error('Erreur lecture dossier musiques :', error);
    res.status(500).json({ error: 'Impossible de lister les musiques' });
  }
}
