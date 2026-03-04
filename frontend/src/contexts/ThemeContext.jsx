import React, { createContext, useContext } from 'react';

// Create context
const ThemeContext = createContext();

// ThemeWrapper component
export const ThemeWrapper = ({ children, darkMode }) => {
  return (
    <ThemeContext.Provider value={darkMode}>
      <div className={darkMode ? 'theme-dark' : 'theme-light'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme - SIMPLIFIED - never throws
export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context; // Will be undefined if not in ThemeWrapper
};

// Helper function to get theme classes
export const getThemeClasses = (darkMode) => {
  // Default to false if darkMode is undefined
  const isDark = darkMode === true;
  
  return {
    // Backgrounds
    bg: {
      primary: isDark ? 'bg-slate-950' : 'bg-slate-50',
      secondary: isDark ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-gradient-to-br from-white to-violet-50/60',
      tertiary: isDark ? 'bg-slate-800/80' : 'bg-violet-50',
    },
    
    // Text
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-800',
      secondary: isDark ? 'text-slate-300' : 'text-slate-600',
      muted: isDark ? 'text-slate-400' : 'text-slate-500',
    },
    
    // Borders
    border: {
      primary: isDark ? 'border-slate-700/70' : 'border-violet-100',
      secondary: isDark ? 'border-slate-600/70' : 'border-slate-300',
    },
    
    // Inputs
    input: {
      bg: isDark ? 'bg-slate-900/90' : 'bg-white',
      border: isDark ? 'border-slate-700/70' : 'border-slate-300',
      text: isDark ? 'text-slate-100' : 'text-slate-800',
    },
  };
};

// Direct hook for theme classes
export const useThemeClasses = () => {
  const darkMode = useTheme();
  return getThemeClasses(darkMode);
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <ThemeContext.Provider value={darkMode}>
      <div className={darkMode ? "theme-dark" : "theme-light"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
