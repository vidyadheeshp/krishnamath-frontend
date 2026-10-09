import {
  BarChart3,
  CalendarOff,
  ClipboardList,
  Banknote,
  HandCoins,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  Landmark,
  ListChecks,
  Receipt,
  Sparkles,
  Users,
} from 'lucide-react';

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  FINANCE: 'finance',
};

const { SUPER_ADMIN, ADMIN, FINANCE } = ROLES;

// Each item lists the roles allowed to see it; the same table drives routing, so the menu and the
// route guards cannot drift apart. The API enforces the same rules independently.
export const navigationSections = [
  {
    key: 'nav.sectionOperations',
    items: [
      { key: 'nav.dashboard', path: '/', icon: LayoutDashboard, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.bookings', path: '/bookings', icon: CalendarCheck, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.sevaList', path: '/seva-list', icon: ClipboardList, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.receipts', path: '/receipts', icon: HandCoins, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.expenditures', path: '/expenditures', icon: Receipt, roles: [SUPER_ADMIN, ADMIN] },
    ],
  },
  {
    key: 'nav.sectionFinance',
    items: [
      { key: 'nav.financeOverview', path: '/finance', icon: Landmark, roles: [SUPER_ADMIN, FINANCE] },
      { key: 'nav.financePayments', path: '/finance/payments', icon: Banknote, roles: [SUPER_ADMIN, FINANCE] },
      { key: 'nav.financeExpenditures', path: '/finance/expenditures', icon: BarChart3, roles: [SUPER_ADMIN, FINANCE] },
      { key: 'nav.reports', path: '/reports', icon: FileText, roles: [SUPER_ADMIN, ADMIN, FINANCE] },
    ],
  },
  {
    key: 'nav.sectionConfiguration',
    items: [
      { key: 'nav.sevas', path: '/sevas', icon: Sparkles, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.blockedDates', path: '/blocked-dates', icon: CalendarOff, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.metadata', path: '/metadata', icon: ListChecks, roles: [SUPER_ADMIN, ADMIN] },
      { key: 'nav.users', path: '/users', icon: Users, roles: [SUPER_ADMIN] },
    ],
  },
];

export const allowedRoles = (path) =>
  navigationSections.flatMap((section) => section.items).find((item) => item.path === path)?.roles ?? [];

export const homePathFor = (role) => (role === FINANCE ? '/finance' : '/');
