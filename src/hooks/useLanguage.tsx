import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'he' | 'ru';

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
    'dashboard.ammoStatus': 'Ammo Status',
    'dashboard.tranche': 'Tranche',
    'dashboard.used': 'Used',
    'dashboard.available': 'Available',
    'dashboard.snp': 'S&P 500',
    'dashboard.ta125': 'TA-125',
    'dashboard.cash': 'Cash',
    'dashboard.total': 'Total',

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
    'update.spyProxy': 'SPY (S&P 500)',
    'update.eisProxy': 'EIS (Israel ETF / TA-125 proxy)',

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
    'settings.snpPercent': 'SNP (%)',
    'settings.ta125Percent': 'TA125 (%)',
    'settings.cashPercent': 'Cash (%)',

    // Logs page
    'logs.title': 'Activity Logs',
    'logs.subtitle': 'View your portfolio history and recommendations',
    'logs.portfolioSnapshots': 'Portfolio Snapshots',
    'logs.recommendations': 'Recommendations',
    'logs.contributions': 'Contributions',
    'logs.noSnapshots': 'No portfolio snapshots yet',
    'logs.noRecommendations': 'No recommendations logged yet',
    'logs.noContributions': 'No contributions recorded yet',
    'logs.date': 'Date',
    'logs.type': 'Type',
    'logs.amount': 'Amount',
    'logs.status': 'Status',

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
    'admin.syncOwner': 'Sync Owner',
    'admin.userInvited': 'User invited successfully',
    'admin.userDeleted': 'User deleted successfully',
    'admin.passwordReset': 'Password reset email sent',

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
    'common.success': 'Success',
    'common.refresh': 'Refresh',

    // Market status
    'market.normal': 'Normal',
    'market.correction': 'Correction',
    'market.bear': 'Bear Market',
    'market.crash': 'Crash',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.noNotifications': 'No notifications',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
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
    'dashboard.ammoStatus': 'מצב תחמושת',
    'dashboard.tranche': 'שלב',
    'dashboard.used': 'נוצל',
    'dashboard.available': 'זמין',
    'dashboard.snp': 'S&P 500',
    'dashboard.ta125': 'ת"א-125',
    'dashboard.cash': 'מזומן',
    'dashboard.total': 'סה"כ',

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
    'update.spyProxy': 'SPY (S&P 500)',
    'update.eisProxy': 'EIS (תעודת סל ישראל / מתאם ת"א-125)',

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
    'settings.snpPercent': 'SNP (%)',
    'settings.ta125Percent': 'ת"א-125 (%)',
    'settings.cashPercent': 'מזומן (%)',

    // Logs page
    'logs.title': 'יומן פעילות',
    'logs.subtitle': 'צפה בהיסטוריית התיק וההמלצות',
    'logs.portfolioSnapshots': 'תמונות מצב תיק',
    'logs.recommendations': 'המלצות',
    'logs.contributions': 'הפקדות',
    'logs.noSnapshots': 'אין תמונות מצב עדיין',
    'logs.noRecommendations': 'אין המלצות מתועדות עדיין',
    'logs.noContributions': 'אין הפקדות מתועדות עדיין',
    'logs.date': 'תאריך',
    'logs.type': 'סוג',
    'logs.amount': 'סכום',
    'logs.status': 'סטטוס',

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
    'admin.syncOwner': 'סנכרן בעלים',
    'admin.userInvited': 'המשתמש הוזמן בהצלחה',
    'admin.userDeleted': 'המשתמש נמחק בהצלחה',
    'admin.passwordReset': 'אימייל איפוס סיסמה נשלח',

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
    'common.success': 'הצלחה',
    'common.refresh': 'רענן',

    // Market status
    'market.normal': 'רגיל',
    'market.correction': 'תיקון',
    'market.bear': 'שוק דובי',
    'market.crash': 'קריסה',

    // Notifications
    'notifications.title': 'התראות',
    'notifications.markAllRead': 'סמן הכל כנקרא',
    'notifications.noNotifications': 'אין התראות',

    // Auth
    'auth.signIn': 'התחבר',
    'auth.signUp': 'הרשמה',
    'auth.email': 'אימייל',
    'auth.password': 'סיסמה',
    'auth.forgotPassword': 'שכחת סיסמה?',
    'auth.noAccount': 'אין לך חשבון?',
    'auth.hasAccount': 'יש לך חשבון?',
  },
  ru: {
    // Navigation
    'nav.dashboard': 'Панель',
    'nav.portfolioUpdate': 'Обновление портфеля',
    'nav.settings': 'Настройки',
    'nav.logs': 'История',
    'nav.admin': 'Админ',
    'nav.signOut': 'Выйти',
    'nav.appName': 'Portfolio Ammo',

    // Dashboard
    'dashboard.title': 'Панель',
    'dashboard.welcome': 'Добро пожаловать',
    'dashboard.portfolioValue': 'Стоимость портфеля',
    'dashboard.cashAllocation': 'Доля наличных',
    'dashboard.stocksAllocation': 'Доля акций',
    'dashboard.marketStatus': 'Состояние рынка',
    'dashboard.lastUpdate': 'Последнее обновление',
    'dashboard.noData': 'Пока нет данных портфеля',
    'dashboard.addFirstUpdate': 'Добавьте первое обновление портфеля, чтобы начать',
    'dashboard.goToUpdate': 'Перейти к обновлению',
    'dashboard.recentRecommendations': 'Последние рекомендации',
    'dashboard.noRecommendations': 'Пока нет рекомендаций',
    'dashboard.portfolioPerformance': 'Эффективность портфеля',
    'dashboard.drawdownHistory': 'История просадок',
    'dashboard.portfolioProfit': 'Прибыль портфеля',
    'dashboard.ammoStatus': 'Статус резервов',
    'dashboard.tranche': 'Транш',
    'dashboard.used': 'Использовано',
    'dashboard.available': 'Доступно',
    'dashboard.snp': 'S&P 500',
    'dashboard.ta125': 'TA-125',
    'dashboard.cash': 'Наличные',
    'dashboard.total': 'Итого',

    // Update page
    'update.title': 'Обновление портфеля',
    'update.subtitle': 'Запишите ваши вклады и получите рекомендацию',
    'update.currentPortfolio': 'Текущая стоимость портфеля',
    'update.updateHoldings': 'Обновите ваши текущие активы',
    'update.editValues': 'Редактировать',
    'update.cancel': 'Отмена',
    'update.totalPortfolioValue': 'Общая стоимость портфеля',
    'update.newContribution': 'Новый вклад',
    'update.contributionDescription': 'Введите общую сумму вклада – она будет распределена согласно целевому распределению',
    'update.totalContribution': 'Сумма вклада',
    'update.currency': 'Валюта',
    'update.targetAllocation': 'Целевое распределение',
    'update.contributionBreakdown': 'Распределение вклада',
    'update.marketData': 'Рыночные данные',
    'update.loadingMarket': 'Загрузка рыночных данных...',
    'update.price': 'Цена',
    'update.high52w': 'Макс. 52 нед.',
    'update.drawdown': 'Просадка',
    'update.recommendation': 'Рекомендация',
    'update.saveUpdate': 'Сохранить',
    'update.saving': 'Сохранение...',
    'update.settingsRequired': 'Требуются настройки',
    'update.configureSettings': 'Пожалуйста, настройте параметры перед созданием обновления.',
    'update.updateSaved': 'Обновление сохранено с рекомендацией!',
    'update.contributionsSaved': 'Вклады сохранены',
    'update.marketUnavailable': 'Рыночные данные недоступны – рекомендация не сгенерирована',
    'update.spyProxy': 'SPY (S&P 500)',
    'update.eisProxy': 'EIS (Израильский ETF / прокси TA-125)',

    // Settings page
    'settings.title': 'Настройки',
    'settings.subtitle': 'Настройте стратегию вашего портфеля',
    'settings.targetAllocation': 'Целевое распределение',
    'settings.allocationDescription': 'Установите целевое распределение портфеля (сумма должна быть 100%)',
    'settings.allocationSum': 'Сумма распределения',
    'settings.allocationError': 'Распределение должно составлять 100%',
    'settings.contributionSettings': 'Настройки вкладов',
    'settings.monthlyContribution': 'Ежемесячный вклад',
    'settings.baseCurrency': 'Базовая валюта',
    'settings.ammoStrategy': 'Стратегия резервов',
    'settings.strategyDescription': 'Настройте триггеры просадки для развертывания резервов',
    'settings.tranche1': 'Триггер транша 1 (%)',
    'settings.tranche2': 'Триггер транша 2 (%)',
    'settings.tranche3': 'Триггер транша 3 (%)',
    'settings.rebuildThreshold': 'Порог восстановления (%)',
    'settings.cashLimits': 'Лимиты наличных',
    'settings.cashMin': 'Мин. наличные (%)',
    'settings.cashMax': 'Макс. наличные (%)',
    'settings.saveSettings': 'Сохранить настройки',
    'settings.saved': 'Настройки успешно сохранены',
    'settings.snpPercent': 'SNP (%)',
    'settings.ta125Percent': 'TA125 (%)',
    'settings.cashPercent': 'Наличные (%)',

    // Logs page
    'logs.title': 'Журнал активности',
    'logs.subtitle': 'Просмотр истории портфеля и рекомендаций',
    'logs.portfolioSnapshots': 'Снимки портфеля',
    'logs.recommendations': 'Рекомендации',
    'logs.contributions': 'Вклады',
    'logs.noSnapshots': 'Пока нет снимков портфеля',
    'logs.noRecommendations': 'Пока нет записанных рекомендаций',
    'logs.noContributions': 'Пока нет записанных вкладов',
    'logs.date': 'Дата',
    'logs.type': 'Тип',
    'logs.amount': 'Сумма',
    'logs.status': 'Статус',

    // Admin page
    'admin.title': 'Панель администратора',
    'admin.subtitle': 'Управление пользователями и настройками системы',
    'admin.users': 'Пользователи',
    'admin.inviteUser': 'Пригласить',
    'admin.email': 'Email',
    'admin.role': 'Роль',
    'admin.actions': 'Действия',
    'admin.deleteUser': 'Удалить',
    'admin.resetPassword': 'Сброс пароля',
    'admin.syncOwner': 'Синхронизировать',
    'admin.userInvited': 'Пользователь успешно приглашен',
    'admin.userDeleted': 'Пользователь успешно удален',
    'admin.passwordReset': 'Письмо для сброса пароля отправлено',

    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.close': 'Закрыть',
    'common.confirm': 'Подтвердить',
    'common.yes': 'Да',
    'common.no': 'Нет',
    'common.success': 'Успешно',
    'common.refresh': 'Обновить',

    // Market status
    'market.normal': 'Нормальный',
    'market.correction': 'Коррекция',
    'market.bear': 'Медвежий рынок',
    'market.crash': 'Обвал',

    // Notifications
    'notifications.title': 'Уведомления',
    'notifications.markAllRead': 'Отметить все как прочитанные',
    'notifications.noNotifications': 'Нет уведомлений',

    // Auth
    'auth.signIn': 'Войти',
    'auth.signUp': 'Регистрация',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
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
