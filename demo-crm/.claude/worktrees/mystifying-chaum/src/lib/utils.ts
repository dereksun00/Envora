export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const stageColors: Record<string, string> = {
  prospecting: "bg-blue-100 text-blue-800",
  qualification: "bg-purple-100 text-purple-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-green-100 text-green-800",
  closed_lost: "bg-red-100 text-red-800",
};

export const sizeColors: Record<string, string> = {
  startup: "bg-teal-100 text-teal-800",
  mid_market: "bg-indigo-100 text-indigo-800",
  enterprise: "bg-pink-100 text-pink-800",
};

export const activityTypeColors: Record<string, string> = {
  call: "bg-green-100 text-green-800",
  email: "bg-blue-100 text-blue-800",
  meeting: "bg-purple-100 text-purple-800",
  note: "bg-gray-100 text-gray-800",
};

export function stageLabel(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function sizeLabel(size: string): string {
  return size.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
