// Calculation engine for Tabulator

class CalculationEngine {
  constructor() {
    this.tables = new Map();
    this.dependencies = new Map();
  }

  // Register a table with the engine
  registerTable(tableId, tabulatorInstance) {
    this.tables.set(tableId, tabulatorInstance);
  }

  // Parse and evaluate expressions
  evaluateExpression(expression, row, tableId) {
    // Replace cell references with actual values
    const parsedExpression = expression.replace(/([A-Z]+)(\d+)/g, (match, column, rowNum) => {
      const targetTableId = tableId;
      const targetRow = this.tables.get(targetTableId).getRow(rowNum);
      return targetRow.getData()[column] || 0;
    });

    // Evaluate the expression
    try {
      return eval(parsedExpression);
    } catch (error) {
      console.error(`Error evaluating expression: ${expression}`, error);
      return 0;
    }
  }

  // Update dependent cells
  updateDependents(tableId, rowId, column) {
    const key = `${tableId}:${rowId}:${column}`;
    if (this.dependencies.has(key)) {
      this.dependencies.get(key).forEach(dependent => {
        const [depTableId, depRowId, depColumn] = dependent.split(':');
        const table = this.tables.get(depTableId);
        const row = table.getRow(depRowId);
        row.update({ [depColumn]: this.evaluateExpression(table.getColumn(depColumn).definition.calculation, row, depTableId) });
      });
    }
  }

  // Set up dependencies
  setupDependencies(tableId, calculation) {
    const dependencies = calculation.match(/([A-Z]+)(\d+)/g) || [];
    dependencies.forEach(dep => {
      const [column, rowId] = dep.match(/([A-Z]+)(\d+)/).slice(1);
      const key = `${tableId}:${rowId}:${column}`;
      if (!this.dependencies.has(key)) {
        this.dependencies.set(key, new Set());
      }
      this.dependencies.get(key).add(`${tableId}:${rowId}:${calculation}`);
    });
  }
}

// Export a single instance of the calculation engine
export const calculationEngine = new CalculationEngine();
