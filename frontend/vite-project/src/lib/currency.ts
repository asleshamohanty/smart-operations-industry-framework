// Utility function for Indian number formatting
export const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore = 10 million
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh = 100 thousand
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  } else {
    return `₹${amount.toFixed(0)}`;
  }
};

export const formatIndianNumber = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore = 10 million
    return `${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh = 100 thousand
    return `${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  } else {
    return `${amount.toFixed(0)}`;
  }
};
