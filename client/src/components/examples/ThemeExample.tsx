import { useTheme } from "@/context/ThemeProvider/hooks";

export function ThemeExample() {
  // 1. Get the current theme and the function to change it from our context hook.
  const { theme, setTheme } = useTheme();

  // 2. Create the function that will be called on button click.
  const toggleTheme = () => {
    // It checks the current theme and sets it to the opposite value.
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4">
      {/* 
        This is the demonstration box.
        - It has a light blue background (`bg-sky-200`) by default.
        - When the `dark` class is on the <html> tag, the `dark:bg-slate-800` class takes over.
        - The text colors also change to maintain readability.
      */}
      <div
        className="
          w-full max-w-md rounded-xl p-8 
          transition-colors duration-300 ease-in-out
          bg-sky-200 text-sky-900 
          dark:bg-slate-800 dark:text-slate-200
        "
      >
        <h2 className="text-2xl font-bold">Hello Tailwind!</h2>
        <p className="mt-2">
          The background and text color of this box are controlled by the theme.
        </p>
        <p className="mt-4 rounded-md bg-white/50 dark:bg-black/50 p-2 font-mono text-sm">
          Current theme is: <strong>{theme}</strong>
        </p>
      </div>

      {/* 
        This is the button that triggers the change.
        It calls our `toggleTheme` function when clicked.
      */}
      <button
        onClick={toggleTheme}
        className="
          px-6 py-2 rounded-lg font-semibold 
          bg-gray-200 text-gray-800 
          dark:bg-gray-600 dark:text-gray-100
          hover:scale-105 transition-transform
        "
      >
        Toggle Theme
      </button>
    </div>
  );
}
