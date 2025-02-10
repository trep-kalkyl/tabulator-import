export default class CalculationEngine {
    constructor() {
        this.tables = {}; // Store registered tables
    }

    // Register a table by ID
    registerTable(id, table) {
        this.tables[id] = table;
        this.initTable(table);
    }

    // Initialize table calculations
    initTable(table) {
        let columns = table.getColumnDefinitions();

        // Extract formulas
        columns.forEach(col => {
            if (col.formula) {
                col.mutator = (value, data, type, params, component) => {
                    return this.evaluateFormula(col.formula, data, component);
                };
            }
        });

        // Listen for cell edits and trigger updates
        table.on("cellEdited", cell => {
            let row = cell.getRow();
            this.updateRow(row);
            this.updateDependents(row);
        });

        // Initial calculation on load
        table.on("dataLoaded", () => {
            table.getRows().forEach(row => this.updateRow(row));
        });
    }

    // Evaluate formula
    evaluateFormula(formula, data, component) {
        try {
            let row = component.getRow();
            let parent = row.getTreeParent()?.getData() || {};
            let children = row.getTreeChildren().map(child => child.getData());

            let tables = this.tables;
            let rowIndex = row.getPosition(true);

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

    // Update a row's calculated values
    updateRow(row) {
        row.update(row.getData());
    }

    // Update dependent rows
    updateDependents(row) {
        let children = row.getTreeChildren();
        children.forEach(child => {
            this.updateRow(child);
            this.updateDependents(child);
        });
    }
}

// Create a singleton instance
const calcEngine = new CalculationEngine();
export default calcEngine;
