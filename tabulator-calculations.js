// tabulator-calculations.js

// Function to evaluate mathematical expressions
function evaluateExpression(expression, data) {
    try {
        // Replace column names with their values in the expression
        const evaluatedExpression = expression.replace(/[a-zA-Z_]\w*/g, (match) => {
            return data[match] || 0; // Fallback to 0 if the column is not found
        });

        // Evaluate the expression safely
        return new Function(`return ${evaluatedExpression}`)();
    } catch (error) {
        console.error(`Error evaluating expression: ${expression}`, error);
        return null; // Fallback to null in case of error
    }
}

// Custom mutator for calculations
function calculationMutator(value, data, type, params, component) {
    const expression = params.expression; // Get the expression from column definition
    return evaluateExpression(expression, data);
}

// Function to update dependent cells
function updateDependentCells(table, cell, expression) {
    const data = cell.getData();
    const result = evaluateExpression(expression, data);

    if (result !== null) {
        cell.setValue(result);
    }
}

// Function to setup reactive calculations
function setupReactiveCalculations(table) {
    table.on("dataChanged", (data) => {
        data.forEach((row) => {
            table.getColumns().forEach((column) => {
                const columnDefinition = column.getDefinition();
                if (columnDefinition.calculation) {
                    const cell = table.getCell(row, column.getField());
                    updateDependentCells(table, cell, columnDefinition.calculation);
                }
            });
        });
    });
}
