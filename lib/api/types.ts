export type InternalUser = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  roles: Array<"super-admin" | "admin" | "hr">;
  status: "active";
};

export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export type BackendLoginResponse = {
  data: {
    tokens: TokenPair;
    user: InternalUser;
  };
  message: string;
  success: true;
};

export type DashboardSummary = {
  activeClients: number;
  pendingVerification: number;
  suspendedClients: number;
  totalClients: number;
};

export type AdminClient = {
  balances: AdminClientBalance[];
  createdAt: string;
  email: string;
  emailVerifiedAt: string | null;
  firstName: string;
  id: string;
  investmentProfile: {
    experience: "New investor" | "Some experience" | "Experienced";
    investmentRange:
      | "$50–$249"
      | "$250–$449"
      | "$500–$999"
      | "$1000+";
    objective:
      | "Short-term opportunity"
      | "Portfolio diversification"
      | "Income generation"
      | "Capital growth";
  };
  lastName: string;
  phone: string;
  status: "pending_verification" | "active" | "suspended";
  updatedAt: string;
};

export type AdminClientBalance = {
  availableBalance: string;
  currency: string;
  lastTransactionAt: string | null;
  lockedBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
};

export type AdminBalanceTransaction = {
  amount: string;
  balanceAfter: string;
  balanceBefore: string;
  createdAt: string;
  currency: string;
  description: string;
  direction: "credit" | "debit";
  id: string;
  sourceAmount?: string | null;
  sourceCurrency?: string | null;
  type:
    | "deposit"
    | "withdrawal"
    | "adjustment"
    | "investment"
    | "capital_return"
    | "profit_withdrawal";
};

export type AdminTransaction = AdminBalanceTransaction & {
  client?: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  };
  deposit?: {
    id: string;
    methodName: string;
    network: string;
    status: "approved" | "pending" | "rejected";
    transactionHash: string;
  };
};

export type AdminClientDetails = {
  balances: AdminClientBalance[];
  client: AdminClient;
  deposits: AdminDeposit[];
  investments: AdminClientInvestment[];
  transactions: AdminBalanceTransaction[];
};

export type AdminClientInvestment = {
  amountUsd: string;
  capitalReturnedAt: string | null;
  createdAt: string;
  daysCompleted: number;
  daysRemaining: number;
  exchangeRate: string;
  id: string;
  maturesAt: string;
  plan: {
    allocation: string;
    dailyObjective: number;
    horizonDays: number;
    name: string;
    risk: string;
    slug: string;
  };
  profit: {
    accruedDays: number;
    availableUsd: string;
    availableWalletAmount: string;
    dailyUsd: string;
    dailyWalletAmount: string;
    totalAccruedUsd: string;
    totalAccruedWalletAmount: string;
    withdrawnUsd: string;
    withdrawnWalletAmount: string;
  };
  progressPercent: number;
  projectedProfitUsd: string;
  projectedTotalUsd: string;
  startsAt: string;
  status: "active" | "matured" | "completed" | "cancelled";
  walletAmount: string;
  walletCurrency: string;
};

export type AdminPaymentMethod = {
  asset: string | null;
  category: "bank" | "card" | "crypto" | "wallet";
  code: string;
  displayOrder: number;
  id: string;
  instructions: string;
  maximumAmount: number | null;
  minimumAmount: number | null;
  name: string;
  network: string | null;
  qrCodeUrl: string | null;
  status: "active" | "coming_soon" | "disabled";
  walletAddress: string | null;
};

export type AdminInvestmentPlan = {
  allocation: string;
  badge: string | null;
  dailyObjective: number;
  description: string;
  displayOrder: number;
  features: string[];
  horizonDays: number;
  icon: "chart" | "coins" | "globe" | "leaf" | "shield" | "sparkle";
  id: string;
  isFeatured: boolean;
  minimumInvestment: number;
  name: string;
  risk: string;
  slug: string;
  status: "active" | "coming_soon" | "disabled";
};

export type AdminDepositActivity = {
  actorLabel: string;
  actorType: "client" | "internal" | "system";
  createdAt: string;
  event: string;
  id: string;
  metadata: Record<string, string>;
  newStatus: string | null;
  previousStatus: string | null;
};

export type AdminDeposit = {
  activities: AdminDepositActivity[];
  amount: string;
  asset: string;
  client?: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  };
  clientNotes: string;
  convertedAmount: string | null;
  convertedAsset: string | null;
  createdAt: string;
  destinationWalletAddress: string;
  id: string;
  methodCode: string;
  methodName: string;
  network: string;
  paymentCategory: "crypto" | "wallet";
  exchangeRate: string | null;
  quoteExpiresAt: string | null;
  rateQuotedAt: string | null;
  rateSource: string | null;
  reviewNotes: string;
  reviewedAt: string | null;
  senderWalletAddress: string;
  status: "approved" | "pending" | "rejected";
  transactionHash: string;
  updatedAt: string;
};

export type AdminDepositConversion = {
  amount: number;
  convertedAmount: number;
  from: { code: string; name: string; type: string };
  lastUpdated: string;
  paymentMethod: {
    asset: string;
    id: string;
    name: string;
    network: string;
  };
  quoteExpiresAt: string;
  rate: number;
  source: string;
  to: { code: string; name: string; type: string };
};

export type AdminWithdrawal = {
  activities: AdminDepositActivity[];
  amount: string;
  asset: string;
  client?: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  };
  createdAt: string;
  destinationLabel: string;
  destinationNetwork: string;
  destinationWalletAddress: string;
  id: string;
  paymentMethodId: string;
  reviewNotes: string;
  reviewedAt: string | null;
  status: "approved" | "pending" | "rejected";
  updatedAt: string;
};
