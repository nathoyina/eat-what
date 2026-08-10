const GENERIC = [
  "Fate just plated your dinner. Dig in!",
  "The wheel has spoken — makan time, lah!",
  "Decision fatigue: cured. Appetite: activated.",
  "Stop scrolling. Start chewing.",
  "Your stomach filed a formal request. Granted.",
  "Tonight's special: whatever the wheel says.",
  "Group chat can rest. Dinner is settled.",
  "Hungry? The universe (and this wheel) agrees.",
];

const BY_CUISINE: Record<string, string[]> = {
  Chinese: [
    "Dim sum-thing special just landed for you.",
    "Wok this way — dinner awaits.",
    "Rice, rice baby. You're eating Chinese tonight.",
  ],
  Malay: [
    "Nasi-ly the right call. Selamat makan!",
    "Satay-sfying choice ahead.",
    "Rendang? More like ren-YUM.",
  ],
  Indian: [
    "Curry on — this one's a winner.",
    "Naan of your business… except dinner is.",
    "Spice it up. The wheel chose wisely.",
  ],
  Japanese: [
    "Wasabi-lieve it — this is your spot.",
    "Soy good it's practically destiny.",
    "Ramen-tic dinner plans incoming.",
  ],
  Korean: [
    "Kimchi-lly serious about this pick.",
    "Seoul-searching ends here. Eat!",
    "BBQ-lieve in the wheel.",
  ],
  Thai: [
    "Thai-rific choice. Pad Thai awaits… or whatever they serve.",
    "Tom yum? More like tom YUM.",
    "Basil-ically perfect. Let's go Thai.",
  ],
  Western: [
    "Fork yeah — Western it is.",
    "Grill power activated.",
    "Burger? Steak? The wheel knows best.",
  ],
  Italian: [
    "Pasta la vista, baby — you're eating here.",
    "Olive you for spinning. Italian night!",
    "That's amore… and also dinner.",
  ],
  Vietnamese: [
    "Pho-get the debate. This is the one.",
    "Banhi-lieve in fate.",
    "Spring roll with it — Vietnamese wins.",
  ],
  Cafe: [
    "Brew-tiful choice. Coffee optional, carbs mandatory.",
    "Latte decide: you're going cafe.",
    "Brunch energy, any hour.",
  ],
  Salad: [
    "Lettuce eat — greens for the win.",
    "Romaine calm and chomp on.",
    "You're on a roll… a salad roll.",
  ],
  Hawker: [
    "Hawker hero unlocked. Queue proudly.",
    "Shiok levels: critically high.",
    "Uncle and auntie approve this spin.",
  ],
  Seafood: [
    "Shore thing — seafood tonight.",
    "Clam before the storm of deliciousness.",
    "You're on a roll… and maybe chili crab.",
  ],
  Peranakan: [
    "Nonya business but dinner is sorted.",
    "Rempah-kable pick. Go Peranakan!",
    "Auntie would be proud of this spin.",
  ],
  French: [
    "Oui did it — French finesse tonight.",
    "Bon appétit, the fancy way.",
    "Croissant doubt: this is correct.",
  ],
  Mediterranean: [
    "Olive the drama — Mediterranean it is.",
    "Feta chance at a great meal.",
    "Seas the day. Med vibes only.",
  ],
  Fusion: [
    "Best of both worlds on one plate.",
    "Rules? Blended. Dinner? Sorted.",
    "Fusion confusion ends here.",
  ],
};

let lastPun = "";

export function pickPun(cuisine: string): string {
  const pool = [...(BY_CUISINE[cuisine] ?? []), ...GENERIC];
  let choice = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    let guard = 0;
    while (choice === lastPun && guard < 8) {
      choice = pool[Math.floor(Math.random() * pool.length)];
      guard++;
    }
  }
  lastPun = choice;
  return choice;
}
