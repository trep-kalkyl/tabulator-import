// calculationEngine.js - Handles dynamic calculations in Tabulator

class CalculationEngine {
    constructor() {
        this.tables = {}; // Store references to all Tabulator instances
    }

    /**
     * Registers a Tabulator instance for calculation references.
     * Automatically applies calculations and sets up event listeners.
     * @param {string} name - The table name identifier.
     * @param {object} instance - The Tabulator instance.
     */
    registerTable(name, instance) {
        this.tables[name] = instance;
        this.applyCalculations(name); // Run calculations on load

        // Listen for cell edits and trigger recalculations
        instance.on("cellEdited", (cell) => {
            this.applyCalculations(name);
        });
    }

    /**
     * Parses a formula and replaces references with actual values.
     * Supports:
     * - "col1 + col2" (same table reference)
     * - "table2.col3[row=5]" (external table reference)
     * - "parent.col1" (parent row reference in nested tables)
     * - "child[0].col2" (first child row reference in nested tables)
     * @param {string} formula - The formula string to parse.
     * @param {object} row - The current row instance.
     * @param {string} tableName - The name of the current table.
     * @returns {function} - A function that computes the formula.
     */
    parseFormula(formula, row, tableName) {
        try {
            let expression = formula;

            // Replace references to columns within the same table
            expression = expression.replace(/(\w+)/g, (match) => {
                if (row.getData().hasOwnProperty(match)) {
                    return `parseFloat(row.getData()['${match}']) || 0`;
                }
                return match;
            });

            // Replace references to other tables
            expression = expression.replace(/(\w+)\.(\w+)\[row=(\d+)\]/g, (match, tab, col, index) => {
                if (this.tables[tab]) {
                    let targetRow = this.tables[tab].getRowFromPosition(parseInt(index));
                    return targetRow ? `parseFloat(${targetRow.getData()[col]}) || 0` : '0';
                }
                return '0';
            });

            // Replace references to parent rows
            expression = expression.replace(/parent\.(\w+)/g, (match, col) => {
                let parentRow = row.getTreeParent();
                return parentRow ? `parseFloat(parentRow.getData()['${col}']) || 0` : '0';
            });

            // Replace references to child rows
            expression = expression.replace(/child\[(\d+)\]\.(\w+)/g, (match, index, col) => {
                let children = row.getTreeChildren();
                return children && children.length > index ? `parseFloat(children[${index}].getData()['${col}']) || 0` : '0';
            });

            return new Function('row', 'parentRow', 'children', `return ${expression};`);
        } catch (e) {
            console.error(`Formula parsing error: ${formula}`, e);
            return () => 0; // Fallback function
        }
    }

    /**
     * Applies calculations for all rows and columns in a given table.
     * Runs on table initialization and whenever data changes.
     * @param {string} tableName - The name of the table.
     */
    applyCalculations(tableName) {
        let table = this.tables[tableName];
        if (!table) return;
        
        table.getRows().forEach(row => {
            let parentRow = row.getTreeParent();
            let children = row.getTreeChildren();
            
            table.getColumns().forEach(col => {
                let columnDef = col.getDefinition();
                if (columnDef.formula) {
                    let calcFn = this.parseFormula(columnDef.formula, row, tableName);
                    let newValue = calcFn(row, parentRow, children);
                    row.update({ [columnDef.field]: newValue });
                }
            });
        });
    }
}

const calcEngine = new CalculationEngine();
export default calcEngine;
