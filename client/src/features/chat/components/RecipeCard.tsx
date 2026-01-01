// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecipeCard({ result }: { result: any }) {
  if (!result.success) return null;

  return (
    <div className="my-4 grid gap-4 md:grid-cols-2">
      {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {result.recipes.map((recipe: any) => (
        <div
          key={recipe.id}
          className="bg-card text-card-foreground overflow-hidden rounded-lg border shadow-sm"
        >
          {recipe.image && (
            <div className="relative aspect-video w-full overflow-hidden">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="mb-2 leading-tight font-semibold">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="decoration-primary hover:underline"
              >
                {recipe.title}
              </a>
            </h3>
            <div className="text-muted-foreground mb-3 flex items-center text-xs">
              <span className="bg-secondary mr-2 rounded-md px-2 py-0.5">
                {recipe.readyInMinutes} min
              </span>
              <span>{recipe.servings} servings</span>
            </div>
            {/* Clean summary truncated */}
            <p className="text-muted-foreground line-clamp-3 text-xs">
              {recipe.summary}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
