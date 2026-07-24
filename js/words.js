// words.js — word banks organized by category, each split by difficulty tier
const WORDS = {
  random: {
    easy: ['cat','dog','sun','run','big','red','box','pen','sky','key','ice','egg','hat','map','net'],
    medium: ['garden','planet','window','pencil','yellow','castle','forest','bottle','rocket','silver','purple','wonder','dragon','pillow','bright'],
    hard: ['adventure','discovery','beautiful','wonderful','mysterious','celebrate','universe','chocolate','umbrella','telephone','butterfly','curiosity'],
    expert: ['extraordinary','unbelievable','sophisticated','revolutionary','characteristic','representative','confidentiality','disproportionate']
  },
  programming: {
    easy: ['code','loop','bug','array','func','node','byte','file','link','call'],
    medium: ['variable','function','compiler','database','iterator','callback','interface','constant','boolean','runtime'],
    hard: ['asynchronous','inheritance','encapsulation','recursion','middleware','constructor','dependency','serialization'],
    expert: ['polymorphism','implementation','optimization','abstraction','concurrency','idempotent','multithreading','deserialization']
  },
  gaming: {
    easy: ['level','boss','loot','quest','spawn','buff','nerf','raid','xp','hp'],
    medium: ['respawn','sidequest','inventory','multiplayer','checkpoint','character','gameplay','joystick'],
    hard: ['leaderboard','achievement','matchmaking','speedrun','permadeath','crosshair'],
    expert: ['procedural generation','frame rate','hitbox precision','damage scaling','netcode latency']
  },
  technology: {
    easy: ['app','wifi','chip','disk','scan','byte','port','cloud','pixel','laser'],
    medium: ['firewall','network','hardware','software','bandwidth','processor','algorithm'],
    hard: ['encryption','bluetooth','microchip','satellite','automation','virtualization'],
    expert: ['cybersecurity','quantum computing','artificial intelligence','blockchain protocol']
  },
  science: {
    easy: ['atom','cell','mass','wave','heat','acid','gene','light','force','orbit'],
    medium: ['gravity','molecule','particle','electron','organism','reaction','velocity'],
    hard: ['photosynthesis','thermodynamics','ecosystem','radiation','catalyst'],
    expert: ['quantum mechanics','biodiversity','electromagnetic','thermonuclear']
  },
  animals: {
    easy: ['cat','dog','fox','owl','bear','lion','wolf','frog','duck','goat'],
    medium: ['dolphin','giraffe','penguin','octopus','panther','squirrel'],
    hard: ['rhinoceros','chimpanzee','hippopotamus','salamander'],
    expert: ['echidna platypus','armadillo variety','invertebrate species']
  },
  countries: {
    easy: ['peru','chad','cuba','fiji','laos','mali','togo','oman'],
    medium: ['brazil','canada','sweden','norway','mexico','turkey'],
    hard: ['argentina','indonesia','madagascar','kazakhstan'],
    expert: ['liechtenstein','czech republic','united arab emirates']
  },
  business: {
    easy: ['cash','deal','firm','loan','sale','cost','fund','risk'],
    medium: ['revenue','contract','marketing','strategy','customer'],
    hard: ['negotiation','shareholder','acquisition','forecasting'],
    expert: ['diversification','entrepreneurship','organizational structure']
  },
  medical: {
    easy: ['pill','scan','pulse','virus','nurse','organ','bone'],
    medium: ['syringe','diagnosis','infection','vaccine','surgery'],
    hard: ['antibiotic','cardiovascular','immunology','anesthesia'],
    expert: ['pharmaceutical','epidemiology','musculoskeletal']
  }
};

function getWordPool(category, difficulty) {
  const cat = WORDS[category] || WORDS.random;
  if (difficulty === 'mixed') {
    return [...cat.easy, ...cat.medium, ...cat.hard];
  }
  return cat[difficulty] || cat.medium;
}
