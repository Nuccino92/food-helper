interface Recipe {
  id: number;
  title: string;
  image: string;
  sourceUrl: string;
  readyInMinutes: number;
}

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  if (!recipe) return null;

  return (
    <a
      href={recipe.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card text-card-foreground dark:hover:border-primary/50 mb-3 block max-w-sm overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/600x400?text=No+Image";
          }}
        />
        <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          ⏱ {recipe.readyInMinutes} min
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between p-3">
        <h3 className="line-clamp-2 text-sm leading-tight font-semibold">
          {recipe.title}
        </h3>
        <span className="text-primary ml-3 flex-shrink-0 text-sm font-medium opacity-70 transition-opacity group-hover:opacity-100">
          View Recipe →
        </span>
      </div>
    </a>
  );
}
