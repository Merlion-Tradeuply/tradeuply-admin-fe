import {
  Coins,
  ArrowUp,
  CreditCard,
  Briefcase,
  Receipt,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";

export const adminNavigation = [
  {
    href: "/dashboard",
    icon: SquaresFour,
    label: "Dashboard",
  },
  {
    href: "/deposits",
    icon: Coins,
    label: "Deposits",
  },
  {
    href: "/withdrawals",
    icon: ArrowUp,
    label: "Withdrawals",
  },
  {
    href: "/clients",
    icon: UsersThree,
    label: "Clients",
  },
  {
    href: "/transactions",
    icon: Receipt,
    label: "Transactions",
  },
  {
    href: "/payment-methods",
    icon: CreditCard,
    label: "Payment Methods",
  },
  {
    href: "/investment-plans",
    icon: Briefcase,
    label: "Investment Plans",
  },
] as const;
