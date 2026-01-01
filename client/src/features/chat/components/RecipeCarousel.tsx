import { cn } from "@/lib/utils";

interface Recipe {
  id: number;
  title: string;
  image: string;
  sourceUrl: string;
  readyInMinutes: number;
  healthScore: number;
}

interface RecipeCarouselProps {
  recipes: Recipe[];
  query?: string;
}

export function RecipeCarousel({ recipes, query }: RecipeCarouselProps) {
  if (!recipes || recipes.length === 0) return null;

  return (
    <div className="mt-3 flex w-full flex-col gap-2 overflow-hidden">
      {/* Context Header */}
      {query && (
        <div className="my-2 flex items-center gap-3 px-1">
          {/* Left Line: Fades in from transparent to purple/border */}
          <div className="via-border to-primary/50 h-px flex-1 bg-linear-to-r from-transparent opacity-50" />

          {/* Text: The "Shine" Effect */}
          <span className="relative inline-flex overflow-hidden">
            <span className="from-muted-foreground via-primary to-muted-foreground animate-shine relative z-10 bg-linear-to-r bg-size-[200%_auto] bg-clip-text text-[10px] font-extrabold tracking-[0.2em] text-transparent uppercase">
              Recipes for: {query}
            </span>
          </span>

          {/* Right Line: Fades out from purple/border to transparent */}
          <div className="from-primary/50 via-border h-px flex-1 bg-linear-to-r to-transparent opacity-50" />
        </div>
      )}

      {/* Scroll Container */}
      <div className="scrollbar-hide flex snap-x gap-4 overflow-x-auto px-1 pt-1 pb-4">
        {recipes.map((recipe) => (
          <a
            key={recipe.id}
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card text-card-foreground dark:hover:border-primary/50 relative w-[260px] flex-none snap-center overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md"
          >
            {/* Image */}
            <div className="relative aspect-4/3 w-full overflow-hidden">
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
                ⏱ {recipe.readyInMinutes}m
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h3 className="line-clamp-2 min-h-[2.5em] text-sm leading-tight font-semibold">
                {recipe.title}
              </h3>
              <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-[10px]",
                      recipe.healthScore > 60
                        ? "text-green-500"
                        : "text-yellow-500",
                    )}
                  >
                    ●
                  </span>
                  Health: {recipe.healthScore}
                </div>
                <span className="text-primary font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  View ↗
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
