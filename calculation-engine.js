class CalculationEngine {
    constructor() {
        this.tables = new Map();
        this.dependencies = new Map();
    }

    registerTable(tableId, tabulatorInstance) {
        this.tables.set(tableId, tabulatorInstance);
        console.log(`Table registered: ${tableId}`);
    }

    evaluateExpression(expression, row, tableId) {
        const data = row.getData ? row.getData() : row;
        console.log("Evaluating expression:", expression, "with data:", data);
        const parsedExpression = expression.replace(/([A-Z]+)/g, (match, column) => {
            const value = data[column];
            console.log(`Replacing ${column} with value:`, value);
            return typeof value === 'number' ? value : 0;
        });
        console.log("Parsed expression:", parsedExpression);

        try {
            const result = eval(parsedExpression);
            console.log("Evaluation result:", result);
            return result;
        } catch (error) {
            console.error(`Error evaluating expression: ${expression}`, error);
            return 0;
        }
    }

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

    setupDependencies(tableId, calculation) {
        const dependencies = calculation.match(/([A-Z]+)/g) || [];
        dependencies.forEach(dep => {
            const key = `${tableId}:${dep}`;
            if (!this.dependencies.has(key)) {
                this.dependencies.set(key, new Set());
            }
            this.dependencies.get(key).add(`${tableId}:${calculation}`);
        });
        console.log(`Dependencies set up for table ${tableId}:`, this.dependencies);
    }
}

const calculationEngine = new CalculationEngine();

export { calculationEngine };
