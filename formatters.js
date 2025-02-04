export function priceFormatter(cell) {
    // Get the value from the cell and format it as currency
    const value = cell.getValue();
    return value ? value.toFixed(2) + " kr" : "-";
}
