export default class CalculationEngine {
    constructor() {
        this.tables = {}; // Store registered tables
    }

    // Register a table and process formulas
    registerTable(id, table) {
        this.tables[id] = table;
        this.processFormulas(table);
    }

    // Process formulas and assign mutators
    processFormulas(table) {
        let columns = table.getColumnDefinitions();
        let hasFormulas = false;

        columns.forEach(col => {
            if (col.formula) {
                hasFormulas = true;
                col.mutator = (value, data, type, params, component) => {
                    return this.evaluateFormula(col.formula, data, component);
                };
            }
        });

        if (hasFormulas) {
            // Ensure reactivity by updating on cell edits
            table.on("cellEdited", cell => {
                this.updateTable(table);
            });

            // Ensure calculations run on data load
            table.on("dataLoaded", () => {
                this.updateTable(table);
            });
        }
    }

    // Evaluate formula dynamically
    evaluateFormula(formula, data, component) {
        try {
            let row = component.getRow();
            let parent = row.getTreeParent()?.getData() || {};
            let children = row.getTreeChildren().map(child => child.getData());

            let tables = this.tables;
            let rowIndex = row.getPosition(true);

            // Replace placeholders with real values
            let formulaWithValues = formula.replace(/\b(\w+)\b/g, match => {
                if (match in data) return data[match]; // Local field
                if (match === "parent") return parent; // Parent row
                if (match.startsWith("child[")) {
                    let childIndex = parseInt(match.match(/\d+/)[0], 10);
                    return children[childIndex] || {};
                }
                if (match.includes(".")) {
                    let [tableId, field] = match.split(".");
                    let targetTable = tables[tableId];
                    if (targetTable) {
                        let targetRow = targetTable.getRowFromPosition(0, true);
                        return targetRow ? targetRow.getData()[field] : 0;
                    }
                }
                return match;
            });

            return eval(formulaWithValues); // Execute formula safely
        } catch (error) {
            console.error(`Formula error in ${formula}:`, error);
            return null;
        }
    }

    // Update all rows in a table
    updateTable(table) {
        table.getRows().forEach(row => {
            row.update(row.getData());
        });
    }
}

// Create a singleton instance
const calcEngine = new CalculationEngine();
export default calcEngine;
