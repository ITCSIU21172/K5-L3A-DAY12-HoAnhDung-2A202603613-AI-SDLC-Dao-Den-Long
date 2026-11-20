import fs from 'fs';
import path from 'path';

const LEADERBOARD_FILE = path.resolve(process.cwd(), 'data', 'leaderboard.json');

export function getLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
      if (Array.isArray(data.entries)) {
        return data.entries;
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveLeaderboard(entries) {
  const dir = path.dirname(LEADERBOARD_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
}

export function addLeaderboardEntry({ name, score, nights_won, seed, achieved_at }) {
  if (!name || typeof name !== 'string') return false;
  const cleanName = name.trim();
  if (cleanName.length < 3 || cleanName.length > 12) return false;
  if (!/^[A-Za-z0-9_]+$/.test(cleanName)) return false;

  const entries = getLeaderboard();
  const entry = {
    name: cleanName,
    score: Math.max(0, Math.floor(score || 0)),
    nights_won: Math.min(3, Math.max(0, nights_won || 0)),
    achieved_at: achieved_at || new Date().toISOString(),
    seed: seed || 0
  };

  entries.push(entry);

  // Sort descending by score; tiebreak: earlier achieved_at first
  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.achieved_at) - new Date(b.achieved_at);
  });

  // Keep top 10
  const top10 = entries.slice(0, 10);
  saveLeaderboard(top10);
  return top10;
}

export function exportLeaderboardToFile(outPath) {
  const entries = getLeaderboard();
  const dir = path.dirname(outPath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
}
