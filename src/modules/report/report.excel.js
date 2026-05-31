const ExcelJS = require('exceljs');

const COLORS = {
    ORANGE: 'FFF97316',
    BLACK: 'FF111827',
    WHITE: 'FFFFFFFF',
    LIGHT_ORANGE: 'FFFFF7ED',
    GRAY: 'FFF3F4F6',
    BORDER: 'FFE5E7EB',
    TEXT_GRAY: 'FF6B7280',
    GREEN: 'FF16A34A',
    RED: 'FFDC2626',
};

const formatCurrency = (value) => {
    return Number(value || 0);
};

const formatDateTime = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleString('vi-VN');
};

const getTrendText = (trend) => {
    if (trend === 'increase') return 'Tăng';
    if (trend === 'decrease') return 'Giảm';
    return 'Không đổi';
};

const setColumnWidths = (worksheet, widths) => {
    widths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
    });
};

const applyBorder = (cell) => {
    cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER } },
        left: { style: 'thin', color: { argb: COLORS.BORDER } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
        right: { style: 'thin', color: { argb: COLORS.BORDER } },
    };
};

const styleTitleRow = (row) => {
    row.height = 28;

    row.eachCell(cell => {
        cell.font = {
            bold: true,
            size: 16,
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
    });
};

const styleTableHeader = (row) => {
    row.height = 22;

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

        applyBorder(cell);
    });
};

const styleBodyRow = (row) => {
    row.eachCell(cell => {
        applyBorder(cell);

        cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
        };
    });
};

const styleInfoRow = (row) => {
    row.eachCell((cell, colNumber) => {
        applyBorder(cell);

        cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
        };

        if (colNumber === 1) {
            cell.font = {
                bold: true,
                color: { argb: COLORS.BLACK },
            };

            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: COLORS.GRAY },
            };
        }
    });
};

const styleKpiRow = (row) => {
    row.eachCell(cell => {
        applyBorder(cell);

        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.LIGHT_ORANGE },
        };

        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
        };
    });
};

const addEmptyRow = (worksheet) => {
    worksheet.addRow([]);
};

const addSummarySheet = (workbook, summary) => {
    const worksheet = workbook.addWorksheet('Tong quan');

    worksheet.views = [
        {
            showGridLines: false,
        },
    ];

    setColumnWidths(worksheet, [32, 30, 30, 30]);

    const titleRow = worksheet.addRow([
        'BÁO CÁO DOANH THU',
        '',
        '',
        '',
    ]);

    styleTitleRow(titleRow);

    addEmptyRow(worksheet);

    const infoRows = [
        [
            'Loại báo cáo',
            summary.period?.toUpperCase() || '',
            '',
            '',
        ],
        [
            'Thời gian báo cáo',
            `${summary.current_period?.from_date || ''} đến ${summary.current_period?.to_date || ''}`,
            '',
            '',
        ],
        [
            'Ngày xuất báo cáo',
            new Date().toLocaleString('vi-VN'),
            '',
            '',
        ],
    ];

    infoRows.forEach(rowData => {
        const row = worksheet.addRow(rowData);
        styleInfoRow(row);
    });

    addEmptyRow(worksheet);

    const kpiHeaderRow = worksheet.addRow([
        'Tổng doanh thu',
        'Tổng đơn hoàn thành',
        'Giá trị trung bình / đơn',
        '',
    ]);

    styleKpiRow(kpiHeaderRow);

    kpiHeaderRow.eachCell(cell => {
        cell.font = {
            bold: true,
            color: { argb: 'FF9A3412' },
        };
    });

    const kpiValueRow = worksheet.addRow([
        formatCurrency(summary.summary?.total_revenue),
        summary.summary?.total_orders || 0,
        formatCurrency(summary.summary?.average_order_value),
        '',
    ]);

    styleKpiRow(kpiValueRow);

    kpiValueRow.eachCell(cell => {
        cell.font = {
            bold: true,
            size: 13,
            color: { argb: COLORS.BLACK },
        };
    });

    worksheet.getCell(`A${kpiValueRow.number}`).numFmt = '#,##0 "VND"';
    worksheet.getCell(`C${kpiValueRow.number}`).numFmt = '#,##0 "VND"';

    addEmptyRow(worksheet);

    const compareTitleRow = worksheet.addRow([
        'SO SÁNH VỚI KỲ TRƯỚC',
        '',
        '',
        '',
    ]);

    styleTableHeader(compareTitleRow);

    const comparisonRows = [
        [
            'Thời gian kỳ trước',
            summary.previous_period
                ? `${summary.previous_period.from_date} đến ${summary.previous_period.to_date}`
                : '',
            '',
            '',
        ],
        [
            'Doanh thu kỳ trước',
            formatCurrency(summary.comparison?.previous_revenue || 0),
            '',
            '',
        ],
        [
            'Chênh lệch doanh thu',
            formatCurrency(summary.comparison?.revenue_difference || 0),
            '',
            '',
        ],
        [
            'Tỷ lệ tăng trưởng doanh thu',
            `${summary.comparison?.revenue_growth_rate || 0}%`,
            '',
            '',
        ],
        [
            'Xu hướng doanh thu',
            getTrendText(summary.comparison?.revenue_trend),
            '',
            '',
        ],
        [
            'Đơn hàng kỳ trước',
            summary.comparison?.previous_orders || 0,
            '',
            '',
        ],
        [
            'Tỷ lệ tăng trưởng đơn hàng',
            `${summary.comparison?.order_growth_rate || 0}%`,
            '',
            '',
        ],
    ];

    comparisonRows.forEach((rowData, index) => {
        const row = worksheet.addRow(rowData);
        styleInfoRow(row);

        if (index === 1 || index === 2) {
            worksheet.getCell(`B${row.number}`).numFmt = '#,##0 "VND"';
        }

        if (index === 4) {
            const trend = summary.comparison?.revenue_trend;

            if (trend === 'increase') {
                worksheet.getCell(`B${row.number}`).font = {
                    bold: true,
                    color: { argb: COLORS.GREEN },
                };
            }

            if (trend === 'decrease') {
                worksheet.getCell(`B${row.number}`).font = {
                    bold: true,
                    color: { argb: COLORS.RED },
                };
            }
        }
    });

    addEmptyRow(worksheet);

    const noteRow = worksheet.addRow([
        'Ghi chú: Doanh thu được tính từ các đơn hàng đã hoàn thành trong kỳ báo cáo.',
        '',
        '',
        '',
    ]);

    noteRow.getCell(1).font = {
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

    setColumnWidths(worksheet, [8, 45, 18, 24]);

    const titleRow = worksheet.addRow([
        'DOANH THU THEO SẢN PHẨM',
        '',
        '',
        '',
    ]);

    styleTitleRow(titleRow);

    const headerRow = worksheet.addRow([
        'STT',
        'Sản phẩm',
        'Số lượng bán',
        'Doanh thu',
    ]);

    styleTableHeader(headerRow);

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

    setColumnWidths(worksheet, [8, 30, 18, 24, 16]);

    const titleRow = worksheet.addRow([
        'DOANH THU THEO THƯƠNG HIỆU',
        '',
        '',
        '',
        '',
    ]);

    styleTitleRow(titleRow);

    const headerRow = worksheet.addRow([
        'STT',
        'Thương hiệu',
        'Số lượng bán',
        'Doanh thu',
        'Tỷ lệ (%)',
    ]);

    styleTableHeader(headerRow);

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

    setColumnWidths(worksheet, [8, 30, 18, 24, 16]);

    const titleRow = worksheet.addRow([
        'DOANH THU THEO DANH MỤC',
        '',
        '',
        '',
        '',
    ]);

    styleTitleRow(titleRow);

    const headerRow = worksheet.addRow([
        'STT',
        'Danh mục',
        'Số lượng bán',
        'Doanh thu',
        'Tỷ lệ (%)',
    ]);

    styleTableHeader(headerRow);

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

    setColumnWidths(worksheet, [8, 24, 28, 18, 22, 16, 20, 26]);

    const titleRow = worksheet.addRow([
        'DANH SÁCH ĐƠN HÀNG HOÀN THÀNH',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
    ]);

    styleTitleRow(titleRow);

    const headerRow = worksheet.addRow([
        'STT',
        'Mã đơn',
        'Người nhận',
        'Số điện thoại',
        'Tổng tiền',
        'Phương thức',
        'Thanh toán',
        'Ngày hoàn thành',
    ]);

    styleTableHeader(headerRow);

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

    const fileName = `bao-cao-doanh-thu-${summary.period}-${Date.now()}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
    );

    res.setHeader('Content-Length', buffer.length);

    return res.end(Buffer.from(buffer));
};

module.exports = {
    buildRevenueExcel,
};