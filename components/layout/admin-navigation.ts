import {
  Coins,
  CreditCard,
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
] as const;
