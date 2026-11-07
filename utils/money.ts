const lkr = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });

/** The smallest order we take: OnePay refuses smaller LKR amounts. */
export const MIN_ORDER_LKR = 100;

export const meetsMinimumOrder = (total: number) => Math.round(total * 100) / 100 >= MIN_ORDER_LKR;

/** "LKR 4,500.00" */
export const formatLkr = (amount: number) => lkr.format(amount);
