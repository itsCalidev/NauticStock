import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF report for the dashboard summary.
 * @param {Object} data - The data to include in the report.
 * @param {Array} data.kpiData - Array of KPI objects { title, value, subtext, color }.
 * @param {Array} data.lowStockItems - Array of low stock products.
 * @param {Array} data.pendingOrders - Array of pending orders.
 */
export const generateDashboardReport = (data) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Reporte de Estado del Sistema", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${date}`, 14, 28);

    let yPos = 40;

    // KPI Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen General", 14, yPos);
    yPos += 10;

    const kpiRows = [];
    // Group KPIs in pairs for better layout if needed, but simple list for now
    data.kpiData.forEach(kpi => {
        kpiRows.push([kpi.title, kpi.value]);
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: kpiRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Low Stock Table
    if (data.lowStockItems && data.lowStockItems.length > 0) {
        doc.setFontSize(14);
        doc.text("Alerta de Stock Bajo", 14, yPos);
        yPos += 6;

        const lowStockRows = data.lowStockItems.map(item => [
            item.name,
            item.category,
            item.stock,
            item.min_stock,
            item.provider
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Proveedor']],
            body: lowStockRows,
            theme: 'striped',
            headStyles: { fillColor: [192, 57, 43], textColor: 255 },
            styles: { fontSize: 9 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Pending Orders Table
    if (data.pendingOrders && data.pendingOrders.length > 0) {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.text("Órdenes Pendientes", 14, yPos);
        yPos += 6;

        const pendingRows = data.pendingOrders.map(order => [
            order.id,
            order.product_name,
            order.provider_name,
            order.quantity,
            new Date(order.order_date).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['ID', 'Producto', 'Proveedor', 'Cantidad', 'Fecha']],
            body: pendingRows,
            theme: 'striped',
            headStyles: { fillColor: [243, 156, 18], textColor: 255 }, // Orange for pending
            styles: { fontSize: 9 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Top Providers Table
    if (data.topProviders && data.topProviders.length > 0) {
        // Check page break
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.text("Top 5 Proveedores por Volumen", 14, yPos);
        yPos += 6;

        const providerRows = data.topProviders.map(item => [
            item.provider,
            item.orders
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Proveedor', 'Total Órdenes']],
            body: providerRows,
            theme: 'striped',
            headStyles: { fillColor: [142, 68, 173], textColor: 255 },
            styles: { fontSize: 9 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Inventory Value Table
    if (data.stockValueByCategory && data.stockValueByCategory.length > 0) {
        // Check page break
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.text("Valor de Inventario (Top Categorías)", 14, yPos);
        yPos += 6;

        const valueRows = data.stockValueByCategory.map(item => [
            item.category,
            `$${item.value.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Categoría', 'Valor Estimado']],
            body: valueRows,
            theme: 'striped',
            headStyles: { fillColor: [46, 204, 113], textColor: 255 },
            styles: { fontSize: 9 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text('NauticStock System', 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_Sistema_${date.replace(/\//g, '-')}.pdf`);
};

/**
 * Generates a formal Purchase Order PDF.
 * @param {Object} order - The order object.
 */
export const generateOrderPDF = (order) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const orderDate = new Date(order.order_date).toLocaleDateString();
    const expectedDate = order.expected_date ? new Date(order.expected_date).toLocaleDateString() : 'N/A';

    // Header / Logo area
    doc.setFillColor(44, 62, 80); // Dark blue header
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("ORDEN DE COMPRA", 14, 25);

    doc.setFontSize(10);
    doc.text(`Orden #: ${order.id}`, 160, 20);
    doc.text(`Fecha: ${date}`, 160, 28);

    // Company Info (Left)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 50;
    doc.setFont(undefined, 'bold');
    doc.text("NauticStock Inc.", 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text("123 Ocean Drive", 14, yPos + 5);
    doc.text("Miami, FL 33101", 14, yPos + 10);
    doc.text("contact@nauticstock.com", 14, yPos + 15);

    // Provider Info (Right)
    doc.setFont(undefined, 'bold');
    doc.text("Proveedor:", 120, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(order.provider_name || "Proveedor Desconocido", 120, yPos + 5);
    // If we had address/email for provider in the order object, we'd put it here.
    // Assuming basic info for now.

    yPos += 30;

    // Order Details Table
    autoTable(doc, {
        startY: yPos,
        head: [['Descripción', 'Cantidad', 'Fecha Solicitud', 'Fecha Esperada']],
        body: [
            [
                order.product_name || "Producto",
                order.quantity,
                orderDate,
                expectedDate
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 8 },
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Notes section
    doc.setFont(undefined, 'bold');
    doc.text("Notas / Instrucciones:", 14, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    const notes = order.notes || "Sin notas adicionales.";
    const splitNotes = doc.splitTextToSize(notes, 180);
    doc.text(splitNotes, 14, yPos);

    // Signatures
    yPos = 240;
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 80, yPos); // Line for signature 1
    doc.line(120, yPos, 186, yPos); // Line for signature 2

    doc.setFontSize(8);
    doc.text("Autorizado Por", 14, yPos + 5);
    doc.text("Recibido Por", 120, yPos + 5);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gracias por hacer negocios con nosotros.", 105, 280, { align: 'center' });

    doc.save(`Orden_Compra_${order.id}.pdf`);
};
