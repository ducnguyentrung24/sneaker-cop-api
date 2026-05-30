const ExcelJS = require('exceljs');

const COLORS = {
    ORANGE: 'FFF97316',
    BLACK: 'FF111827',
    WHITE: 'FFFFFFFF',
    LIGHT_ORANGE: 'FFFFF7ED',
    GRAY: 'FFF3F4F6',
    BORDER: 'FFE5E7EB',
    TEXT_GRAY: 'FF6B7280',
};

const formatCurrency = (value) => {
    return Number(value || 0);
};

const formatDateTime = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleString('vi-VN');
};

const styleTitleCell = (cell) => {
    cell.font = {
        bold: true,
        size: 18,
        color: { argb: COLORS.WHITE },
    };

    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.BLACK },
    };

    cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
    };
};

const styleTableHeader = (row) => {
    row.eachCell(cell => {
        cell.font = {
            bold: true,
            color: { argb: COLORS.WHITE },
        };

        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.ORANGE },
        };

        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
        };

        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });
};

const styleBodyRow = (row) => {
    row.eachCell(cell => {
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.BORDER } },
            left: { style: 'thin', color: { argb: COLORS.BORDER } },
            bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
            right: { style: 'thin', color: { argb: COLORS.BORDER } },
        };

        cell.alignment = {
            vertical: 'middle',
        };
    });
};

const styleInfoLabel = (cell) => {
    cell.font = {
        bold: true,
        color: { argb: COLORS.BLACK },
    };

    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.GRAY },
    };

    cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER } },
        left: { style: 'thin', color: { argb: COLORS.BORDER } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
        right: { style: 'thin', color: { argb: COLORS.BORDER } },
    };

    cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
    };
};

const styleInfoValue = (cell) => {
    cell.font = {
        color: { argb: COLORS.BLACK },
    };

    cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER } },
        left: { style: 'thin', color: { argb: COLORS.BORDER } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
        right: { style: 'thin', color: { argb: COLORS.BORDER } },
    };

    cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
    };
};

const styleKpiBox = (
    worksheet,
    labelRange,
    valueRange,
    labelCell,
    valueCell
) => {
    worksheet.mergeCells(labelRange);
    worksheet.mergeCells(valueRange);

    const label = worksheet.getCell(labelCell);
    const value = worksheet.getCell(valueCell);

    [label, value].forEach(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.LIGHT_ORANGE },
        };

        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.ORANGE } },
            left: { style: 'thin', color: { argb: COLORS.ORANGE } },
            bottom: { style: 'thin', color: { argb: COLORS.ORANGE } },
            right: { style: 'thin', color: { argb: COLORS.ORANGE } },
        };

        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
        };
    });

    label.font = {
        bold: true,
        size: 11,
        color: { argb: 'FF9A3412' },
    };

    value.font = {
        bold: true,
        size: 14,
        color: { argb: COLORS.BLACK },
    };
};

const addSummarySheet = (workbook, summary) => {
    const worksheet = workbook.addWorksheet('Tong quan');

    worksheet.views = [
        {
            showGridLines: false,
        },
    ];

    worksheet.columns = [
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
    ];

    // Title
    worksheet.mergeCells('A1:F2');
    worksheet.getCell('A1').value = 'BÁO CÁO DOANH THU';
    styleTitleCell(worksheet.getCell('A1'));

    worksheet.getRow(1).height = 28;
    worksheet.getRow(2).height = 28;

    // Report info
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Loại báo cáo';

    worksheet.mergeCells('C4:F4');
    worksheet.getCell('C4').value = summary.period.toUpperCase();

    worksheet.mergeCells('A5:B5');
    worksheet.getCell('A5').value = 'Thời gian báo cáo';

    worksheet.mergeCells('C5:F5');
    worksheet.getCell('C5').value =
        `${summary.current_period.from_date} đến ${summary.current_period.to_date}`;

    worksheet.mergeCells('A6:B6');
    worksheet.getCell('A6').value = 'Ngày xuất báo cáo';

    worksheet.mergeCells('C6:F6');
    worksheet.getCell('C6').value = new Date().toLocaleString('vi-VN');

    ['A4', 'A5', 'A6'].forEach(cell => {
        styleInfoLabel(worksheet.getCell(cell));
    });

    ['C4', 'C5', 'C6'].forEach(cell => {
        styleInfoValue(worksheet.getCell(cell));
    });

    // KPI 1
    worksheet.getCell('A8').value = 'Tổng doanh thu';
    worksheet.getCell('A9').value = formatCurrency(
        summary.summary.total_revenue
    );
    worksheet.getCell('A9').numFmt = '#,##0 "VND"';

    styleKpiBox(
        worksheet,
        'A8:B8',
        'A9:B10',
        'A8',
        'A9'
    );

    // KPI 2
    worksheet.getCell('C8').value = 'Tổng đơn hoàn thành';
    worksheet.getCell('C9').value = summary.summary.total_orders;

    styleKpiBox(
        worksheet,
        'C8:D8',
        'C9:D10',
        'C8',
        'C9'
    );

    // KPI 3
    worksheet.getCell('E8').value = 'Giá trị trung bình / đơn';
    worksheet.getCell('E9').value = formatCurrency(
        summary.summary.average_order_value
    );
    worksheet.getCell('E9').numFmt = '#,##0 "VND"';

    styleKpiBox(
        worksheet,
        'E8:F8',
        'E9:F10',
        'E8',
        'E9'
    );

    worksheet.getRow(8).height = 24;
    worksheet.getRow(9).height = 28;
    worksheet.getRow(10).height = 12;

    // Note
    worksheet.mergeCells('A13:F13');
    worksheet.getCell('A13').value =
        'Ghi chú: Doanh thu được tính từ các đơn hàng đã hoàn thành trong kỳ báo cáo.';
    worksheet.getCell('A13').font = {
        italic: true,
        color: { argb: COLORS.TEXT_GRAY },
    };
};

const addProductSheet = (workbook, products) => {
    const worksheet = workbook.addWorksheet('Theo san pham');

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 2,
        },
    ];

    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'DOANH THU THEO SẢN PHẨM';
    styleTitleCell(worksheet.getCell('A1'));

    worksheet.getRow(1).height = 28;

    worksheet.addRow([
        'STT',
        'Sản phẩm',
        'Số lượng bán',
        'Doanh thu',
    ]);

    styleTableHeader(worksheet.getRow(2));

    products.data.forEach((item, index) => {
        const row = worksheet.addRow([
            index + 1,
            item.product_name,
            item.sold_quantity,
            formatCurrency(item.revenue),
        ]);

        styleBodyRow(row);
    });

    worksheet.getColumn(4).numFmt = '#,##0 "VND"';

    worksheet.columns = [
        { width: 8 },
        { width: 42 },
        { width: 18 },
        { width: 22 },
    ];

    worksheet.autoFilter = {
        from: 'A2',
        to: 'D2',
    };
};

const addBrandSheet = (workbook, brands) => {
    const worksheet = workbook.addWorksheet('Theo thuong hieu');

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 2,
        },
    ];

    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'DOANH THU THEO THƯƠNG HIỆU';
    styleTitleCell(worksheet.getCell('A1'));

    worksheet.getRow(1).height = 28;

    worksheet.addRow([
        'STT',
        'Thương hiệu',
        'Số lượng bán',
        'Doanh thu',
        'Tỷ lệ (%)',
    ]);

    styleTableHeader(worksheet.getRow(2));

    brands.data.forEach((item, index) => {
        const row = worksheet.addRow([
            index + 1,
            item.brand_name,
            item.sold_quantity,
            formatCurrency(item.revenue),
            item.percent,
        ]);

        styleBodyRow(row);
    });

    worksheet.getColumn(4).numFmt = '#,##0 "VND"';

    worksheet.columns = [
        { width: 8 },
        { width: 28 },
        { width: 18 },
        { width: 22 },
        { width: 15 },
    ];

    worksheet.autoFilter = {
        from: 'A2',
        to: 'E2',
    };
};

const addCategorySheet = (workbook, categories) => {
    const worksheet = workbook.addWorksheet('Theo danh muc');

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 2,
        },
    ];

    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'DOANH THU THEO DANH MỤC';
    styleTitleCell(worksheet.getCell('A1'));

    worksheet.getRow(1).height = 28;

    worksheet.addRow([
        'STT',
        'Danh mục',
        'Số lượng bán',
        'Doanh thu',
        'Tỷ lệ (%)',
    ]);

    styleTableHeader(worksheet.getRow(2));

    categories.data.forEach((item, index) => {
        const row = worksheet.addRow([
            index + 1,
            item.category_name,
            item.sold_quantity,
            formatCurrency(item.revenue),
            item.percent,
        ]);

        styleBodyRow(row);
    });

    worksheet.getColumn(4).numFmt = '#,##0 "VND"';

    worksheet.columns = [
        { width: 8 },
        { width: 28 },
        { width: 18 },
        { width: 22 },
        { width: 15 },
    ];

    worksheet.autoFilter = {
        from: 'A2',
        to: 'E2',
    };
};

const addOrderSheet = (workbook, orders) => {
    const worksheet = workbook.addWorksheet('Don hoan thanh');

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 2,
        },
    ];

    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'DANH SÁCH ĐƠN HÀNG HOÀN THÀNH';
    styleTitleCell(worksheet.getCell('A1'));

    worksheet.getRow(1).height = 28;

    worksheet.addRow([
        'STT',
        'Mã đơn',
        'Người nhận',
        'Số điện thoại',
        'Tổng tiền',
        'Phương thức',
        'Thanh toán',
        'Ngày hoàn thành',
    ]);

    styleTableHeader(worksheet.getRow(2));

    orders.data.forEach((order, index) => {
        const row = worksheet.addRow([
            index + 1,
            order.order_code,
            order.receiver_name,
            order.phone,
            formatCurrency(order.final_price),
            order.payment_method,
            order.payment_status,
            formatDateTime(order.completed_at),
        ]);

        styleBodyRow(row);
    });

    worksheet.getColumn(5).numFmt = '#,##0 "VND"';

    worksheet.columns = [
        { width: 8 },
        { width: 22 },
        { width: 25 },
        { width: 18 },
        { width: 20 },
        { width: 15 },
        { width: 18 },
        { width: 25 },
    ];

    worksheet.autoFilter = {
        from: 'A2',
        to: 'H2',
    };
};

const buildRevenueExcel = async ({
    summary,
    products,
    brands,
    categories,
    orders,
    res,
}) => {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Sneaker Cop';
    workbook.created = new Date();

    addSummarySheet(workbook, summary);
    addProductSheet(workbook, products);
    addBrandSheet(workbook, brands);
    addCategorySheet(workbook, categories);
    addOrderSheet(workbook, orders);

    const fileName = `revenue-report-${summary.current_period.from_date}-${summary.current_period.to_date}.xlsx`;

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
};

module.exports = {
    buildRevenueExcel,
};