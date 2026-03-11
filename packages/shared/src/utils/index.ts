/**
 * Format a numeric amount as a currency string.
 *
 * @param amount  - The monetary value.
 * @param currency - ISO 4217 currency code (default "USD").
 * @returns Locale-formatted currency string, e.g. "$1,234.56".
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate the total landed cost for a line item.
 *
 * landed cost = (unitPrice * quantity) + freight + duties
 *
 * @param unitPrice - Cost per unit.
 * @param freight   - Total freight / shipping cost.
 * @param duties    - Total duties / tariffs.
 * @param quantity  - Number of units.
 * @returns The total landed cost.
 */
export function calculateLandedCost(
  unitPrice: number,
  freight: number,
  duties: number,
  quantity: number,
): number {
  return unitPrice * quantity + freight + duties;
}

/**
 * Generate a unique correlation ID for tracing API requests.
 *
 * Format: `mfh-<timestamp_hex>-<random_hex>`
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 10);
  return `mfh-${timestamp}-${random}`;
}

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 *
 * @param text      - The input string.
 * @param maxLength - Maximum allowed length (including ellipsis).
 * @returns The (possibly truncated) string.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  if (maxLength <= 3) {
    return text.slice(0, maxLength);
  }
  return text.slice(0, maxLength - 3) + "...";
}
