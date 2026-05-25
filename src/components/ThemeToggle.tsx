import React, { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ] as const;

  const currentOption = themeOptions.find((opt) => opt.value === theme) || themeOptions[2];
  const ActiveIcon = currentOption.icon;

  const toggleThemeDirect = () => {
    // Cycles between light and dark for quick clicks
    if (resolvedTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <div className="relative z-50">
      <div 
        className="flex items-center gap-1 rounded-full p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 transition-colors shadow-sm"
        id="theme-toggle-container"
      >
        <button
          onClick={toggleThemeDirect}
          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center relative cursor-pointer"
          aria-label="Toggle theme"
          title={`Current theme: ${theme}. Click to toggle.`}
          id="theme-toggle-btn"
        >
          <motion.div
            initial={{ scale: 0.6, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.6, rotate: 45 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            key={resolvedTheme}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            )}
          </motion.div>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
          id="theme-picker-toggle-btn"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click-away */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />

            {/* Menu options */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/50 overflow-hidden z-50 p-1"
              id="theme-picker-menu"
            >
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                    {option.label}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
