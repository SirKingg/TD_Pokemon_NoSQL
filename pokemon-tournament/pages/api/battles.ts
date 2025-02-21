// pages/api/battles.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../lib/dbConnect'
import Battle, { IBattle } from '../../models/Battle'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const battleData: IBattle = req.body;
    const battle = await Battle.create(battleData)
    res.status(200).json({ message: 'Battle data saved successfully', battle })
  } catch (error) {
    console.error('Error saving battle data: ', error)
    res.status(500).json({ error: 'Error saving battle data' })
  }
}
