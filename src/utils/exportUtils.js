import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a un archivo Excel (.xlsx)
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {string} fileName - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (data, fileName) => {
    try {
        // 1. Crear una hoja de trabajo (Worksheet)
        const worksheet = XLSX.utils.json_to_sheet(data);

        // 2. Crear un libro de trabajo (Workbook)
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

        // 3. Generar el archivo y descargarlo
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
        console.error("Error exportando a Excel:", error);
        alert("Hubo un error al exportar el archivo Excel.");
    }
};
