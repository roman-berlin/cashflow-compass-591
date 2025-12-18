import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.portfolioUpdate': 'Portfolio Update',
    'nav.settings': 'Settings',
    'nav.logs': 'Logs',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign Out',
    'nav.appName': 'Portfolio Ammo',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.portfolioValue': 'Portfolio Value',
    'dashboard.cashAllocation': 'Cash Allocation',
    'dashboard.stocksAllocation': 'Stocks Allocation',
    'dashboard.marketStatus': 'Market Status',
    'dashboard.lastUpdate': 'Last Update',
    'dashboard.noData': 'No portfolio data yet',
    'dashboard.addFirstUpdate': 'Add your first portfolio update to get started',
    'dashboard.goToUpdate': 'Go to Portfolio Update',
    'dashboard.recentRecommendations': 'Recent Recommendations',
    'dashboard.noRecommendations': 'No recommendations yet',
    'dashboard.portfolioPerformance': 'Portfolio Performance',
    'dashboard.drawdownHistory': 'Drawdown History',
    'dashboard.portfolioProfit': 'Portfolio Profit',

    // Update page
    'update.title': 'Portfolio Update',
    'update.subtitle': 'Record your contributions and get a recommendation',
    'update.currentPortfolio': 'Current Portfolio Values',
    'update.updateHoldings': 'Update your current holdings',
    'update.editValues': 'Edit Values',
    'update.cancel': 'Cancel',
    'update.totalPortfolioValue': 'Total Portfolio Value',
    'update.newContribution': 'New Contribution',
    'update.contributionDescription': 'Enter your total contribution – it will be split according to your target allocation',
    'update.totalContribution': 'Total Contribution',
    'update.currency': 'Currency',
    'update.targetAllocation': 'Target Allocation',
    'update.contributionBreakdown': 'Contribution Breakdown',
    'update.marketData': 'Market Data',
    'update.loadingMarket': 'Loading market data...',
    'update.price': 'Price',
    'update.high52w': '52W High',
    'update.drawdown': 'Drawdown',
    'update.recommendation': 'Recommendation',
    'update.saveUpdate': 'Save Update',
    'update.saving': 'Saving...',
    'update.settingsRequired': 'Settings Required',
    'update.configureSettings': 'Please configure your settings before creating an update.',
    'update.updateSaved': 'Update saved with recommendation!',
    'update.contributionsSaved': 'Contributions saved',
    'update.marketUnavailable': 'Market data unavailable – recommendation not generated',

    // Settings page
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your portfolio strategy',
    'settings.targetAllocation': 'Target Allocation',
    'settings.allocationDescription': 'Set your target portfolio allocation (must sum to 100%)',
    'settings.allocationSum': 'Allocation Sum',
    'settings.allocationError': 'Allocation must sum to 100%',
    'settings.contributionSettings': 'Contribution Settings',
    'settings.monthlyContribution': 'Monthly Contribution Total',
    'settings.baseCurrency': 'Base Currency',
    'settings.ammoStrategy': 'Ammo Strategy',
    'settings.strategyDescription': 'Configure drawdown triggers for deploying cash reserves',
    'settings.tranche1': 'Tranche 1 Trigger (%)',
    'settings.tranche2': 'Tranche 2 Trigger (%)',
    'settings.tranche3': 'Tranche 3 Trigger (%)',
    'settings.rebuildThreshold': 'Rebuild Threshold (%)',
    'settings.cashLimits': 'Cash Limits',
    'settings.cashMin': 'Cash Min (%)',
    'settings.cashMax': 'Cash Max (%)',
    'settings.saveSettings': 'Save Settings',
    'settings.saved': 'Settings saved successfully',

    // Logs page
    'logs.title': 'Activity Logs',
    'logs.subtitle': 'View your portfolio history and recommendations',
    'logs.portfolioSnapshots': 'Portfolio Snapshots',
    'logs.recommendations': 'Recommendations',
    'logs.contributions': 'Contributions',
    'logs.noSnapshots': 'No portfolio snapshots yet',
    'logs.noRecommendations': 'No recommendations logged yet',
    'logs.noContributions': 'No contributions recorded yet',

    // Admin page
    'admin.title': 'Admin Panel',
    'admin.subtitle': 'Manage users and system settings',
    'admin.users': 'Users',
    'admin.inviteUser': 'Invite User',
    'admin.email': 'Email',
    'admin.role': 'Role',
    'admin.actions': 'Actions',
    'admin.deleteUser': 'Delete User',
    'admin.resetPassword': 'Reset Password',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Market status
    'market.normal': 'Normal',
    'market.correction': 'Correction',
    'market.bear': 'Bear Market',
    'market.crash': 'Crash',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.noNotifications': 'No notifications',
  },
  he: {
    // Navigation
    'nav.dashboard': 'לוח בקרה',
    'nav.portfolioUpdate': 'עדכון תיק',
    'nav.settings': 'הגדרות',
    'nav.logs': 'היסטוריה',
    'nav.admin': 'ניהול',
    'nav.signOut': 'התנתק',
    'nav.appName': 'Portfolio Ammo',

    // Dashboard
    'dashboard.title': 'לוח בקרה',
    'dashboard.welcome': 'ברוך הבא',
    'dashboard.portfolioValue': 'שווי תיק',
    'dashboard.cashAllocation': 'הקצאת מזומן',
    'dashboard.stocksAllocation': 'הקצאת מניות',
    'dashboard.marketStatus': 'מצב שוק',
    'dashboard.lastUpdate': 'עדכון אחרון',
    'dashboard.noData': 'אין נתוני תיק עדיין',
    'dashboard.addFirstUpdate': 'הוסף את העדכון הראשון שלך כדי להתחיל',
    'dashboard.goToUpdate': 'עבור לעדכון תיק',
    'dashboard.recentRecommendations': 'המלצות אחרונות',
    'dashboard.noRecommendations': 'אין המלצות עדיין',
    'dashboard.portfolioPerformance': 'ביצועי תיק',
    'dashboard.drawdownHistory': 'היסטוריית ירידות',
    'dashboard.portfolioProfit': 'רווח תיק',

    // Update page
    'update.title': 'עדכון תיק',
    'update.subtitle': 'רשום את ההפקדות שלך וקבל המלצה',
    'update.currentPortfolio': 'שווי תיק נוכחי',
    'update.updateHoldings': 'עדכן את ההחזקות הנוכחיות',
    'update.editValues': 'ערוך ערכים',
    'update.cancel': 'ביטול',
    'update.totalPortfolioValue': 'שווי תיק כולל',
    'update.newContribution': 'הפקדה חדשה',
    'update.contributionDescription': 'הזן את סכום ההפקדה הכולל – הוא יחולק לפי הקצאת היעד שלך',
    'update.totalContribution': 'סכום הפקדה',
    'update.currency': 'מטבע',
    'update.targetAllocation': 'הקצאת יעד',
    'update.contributionBreakdown': 'פירוט הפקדה',
    'update.marketData': 'נתוני שוק',
    'update.loadingMarket': 'טוען נתוני שוק...',
    'update.price': 'מחיר',
    'update.high52w': 'שיא 52 שבועות',
    'update.drawdown': 'ירידה',
    'update.recommendation': 'המלצה',
    'update.saveUpdate': 'שמור עדכון',
    'update.saving': 'שומר...',
    'update.settingsRequired': 'נדרשות הגדרות',
    'update.configureSettings': 'אנא הגדר את ההגדרות שלך לפני יצירת עדכון.',
    'update.updateSaved': 'עדכון נשמר עם המלצה!',
    'update.contributionsSaved': 'הפקדות נשמרו',
    'update.marketUnavailable': 'נתוני שוק לא זמינים – המלצה לא נוצרה',

    // Settings page
    'settings.title': 'הגדרות',
    'settings.subtitle': 'הגדר את אסטרטגיית התיק שלך',
    'settings.targetAllocation': 'הקצאת יעד',
    'settings.allocationDescription': 'הגדר את הקצאת היעד של התיק (חייב להסתכם ב-100%)',
    'settings.allocationSum': 'סכום הקצאה',
    'settings.allocationError': 'ההקצאה חייבת להסתכם ב-100%',
    'settings.contributionSettings': 'הגדרות הפקדה',
    'settings.monthlyContribution': 'סכום הפקדה חודשית',
    'settings.baseCurrency': 'מטבע בסיס',
    'settings.ammoStrategy': 'אסטרטגיית תחמושת',
    'settings.strategyDescription': 'הגדר טריגרים לפריסת עתודות מזומן',
    'settings.tranche1': 'טריגר שלב 1 (%)',
    'settings.tranche2': 'טריגר שלב 2 (%)',
    'settings.tranche3': 'טריגר שלב 3 (%)',
    'settings.rebuildThreshold': 'סף בנייה מחדש (%)',
    'settings.cashLimits': 'מגבלות מזומן',
    'settings.cashMin': 'מזומן מינימום (%)',
    'settings.cashMax': 'מזומן מקסימום (%)',
    'settings.saveSettings': 'שמור הגדרות',
    'settings.saved': 'ההגדרות נשמרו בהצלחה',

    // Logs page
    'logs.title': 'יומן פעילות',
    'logs.subtitle': 'צפה בהיסטוריית התיק וההמלצות',
    'logs.portfolioSnapshots': 'תמונות מצב תיק',
    'logs.recommendations': 'המלצות',
    'logs.contributions': 'הפקדות',
    'logs.noSnapshots': 'אין תמונות מצב עדיין',
    'logs.noRecommendations': 'אין המלצות מתועדות עדיין',
    'logs.noContributions': 'אין הפקדות מתועדות עדיין',

    // Admin page
    'admin.title': 'פאנל ניהול',
    'admin.subtitle': 'נהל משתמשים והגדרות מערכת',
    'admin.users': 'משתמשים',
    'admin.inviteUser': 'הזמן משתמש',
    'admin.email': 'אימייל',
    'admin.role': 'תפקיד',
    'admin.actions': 'פעולות',
    'admin.deleteUser': 'מחק משתמש',
    'admin.resetPassword': 'אפס סיסמה',

    // Common
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.save': 'שמור',
    'common.cancel': 'ביטול',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.close': 'סגור',
    'common.confirm': 'אישור',
    'common.yes': 'כן',
    'common.no': 'לא',

    // Market status
    'market.normal': 'רגיל',
    'market.correction': 'תיקון',
    'market.bear': 'שוק דובי',
    'market.crash': 'קריסה',

    // Notifications
    'notifications.title': 'התראות',
    'notifications.markAllRead': 'סמן הכל כנקרא',
    'notifications.noNotifications': 'אין התראות',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
