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

// Initialize Tabulator
document.addEventListener("DOMContentLoaded", () => {
    const table = new Tabulator("#example-table", {
        data: [
            { id: 1, a: 10, b: 20, c: 30, d: 40, e: 50 },
            { id: 2, a: 15, b: 25, c: 35, d: 45, e: 55 },
        ],
        columns: [
            { title: "ID", field: "id" },
            { title: "A", field: "a", editor: "number" },
            { title: "B", field: "b", editor: "number" },
            { title: "C", field: "c", editor: "number" },
            { title: "D", field: "d", editor: "number" },
            { title: "E", field: "e", editor: "number" },
            {
                title: "Result",
                field: "result",
                calculation: "a + b + c * d / e", // Example calculation
                formatter: "number",
                formatterParams: { precision: 2 },
            },
        ],
        reactiveData: true, // Enable reactive data updates
    });

    setupReactiveCalculations(table);
});
