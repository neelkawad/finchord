export const categoryGroups: { label: string; icon: string; keywords: string[] }[] = [
  { label: 'Home', icon: 'Home', keywords: ['home', 'mortgage', 'rent'] },
  { label: 'Auto', icon: 'Car', keywords: ['auto', 'car'] },
  { label: 'Medical', icon: 'Stethoscope', keywords: ['medical', 'pharmacy', 'health', 'doctor'] },
  { label: 'Insurance', icon: 'ShieldCheck', keywords: ['insurance'] },
  { label: 'Entertainment', icon: 'Film', keywords: ['entertainment', 'movie', 'movies', 'fun'] },
  { label: 'Food', icon: 'UtensilsCrossed', keywords: ['food', 'eat', 'restaurant', 'grocery', 'groceries'] },
]

export function matchCategoryGroup(name: string): { label: string; icon: string } | null {
  const lower = name.toLowerCase()
  for (const group of categoryGroups) {
    if (group.keywords.some((kw) => lower.includes(kw))) {
      return { label: group.label, icon: group.icon }
    }
  }
  return null
}
