const fetch = require('node-fetch');

async function sendPostRequest(url, data, headers = { 'Content-Type': 'application/json' }) {
    let response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
    });

    let json = await response.json();

    return json;
}

async function convertHTMLToPDF(html) {
    let response = await fetch("https://api.pdfendpoint.com/v1/convert", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PDFENDPOINT_APIKEY}`
        },
        body: JSON.stringify({
            "sandbox": false,
            "orientation": "vertical",
            "page_size": "A4",
            "margin_top": "2cm",
            "margin_bottom": "2cm",
            "margin_left": "2cm",
            "margin_right": "2cm",
            "html": html,
        })
    });

    let json = await response.json();

    return json;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(date) {
    return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
}

function getInvoiceTable(priceArr, paymentDescriptionArr) {
    let html =
        `
        <table style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <td style="border: 1px solid black; padding: 20px;">
                            <p><span style="font-weight: bold">Description</span></p>
                        </td>
                        <td style="border: 1px solid black; padding: 20px;">
                            <p><span style="font-weight: bold">Start Date</span></p>
                        </td>
                        <td style="border: 1px solid black; padding: 20px;">
                            <p><span style="font-weight: bold">End Date</span></p>
                        </td>
                        <td style="border: 1px solid black; padding: 20px;">
                            <p><span style="font-weight: bold">Currency</span></p>
                        </td>
                        <td style="border: 1px solid black; padding: 20px;">
                            <p><span style="font-weight: bold">Amount Due</span></p>
                        </td>
                    </tr>

                </thead>
                <tbody>
    `;
    let numElms = priceArr.length;
    let totalPrice = 0;

    for (let i = 0; i < numElms; i++) {
        totalPrice += Number(priceArr[i]);

        html +=
            `
        <tr>
            <td style="border: 1px solid black; padding: 20px;">
                <p><span>${paymentDescriptionArr[i]}</span></p>
            </td>
            <td style="border: 1px solid black; padding: 20px;">
                <p><span>{{startDate}}</span></p>
            </td>
            <td style="border: 1px solid black; padding: 20px;">
                <p><span>{{endDate}}</span></p>
            </td>
            <td style="border: 1px solid black; padding: 20px;">
                <p><span>{{currencySign}}</span></p>
            </td>
            <td style="border: 1px solid black; padding: 20px;">
                <p><span>${numberWithCommas(Number(priceArr[i]).toFixed(2))}</span></p>
            </td>
        </tr>
        `;
    }

    html +=
        `            
            <tr>
                <td style="border: 1px solid black; padding: 20px;" colspan="3">
                    <p><span style="font-weight: bold">TOTAL</span></p>
                </td>
                <td style="border: 1px solid black; padding: 20px;">
                    <p><span>{{currencySign}}</span></p>
                </td>
                <td style="border: 1px solid black; padding: 20px;">
                    <p><span>${numberWithCommas(totalPrice.toFixed(2))}</span></p>
                </td>
            </tr>
        </tbody>
    </table>
    `;

    return html;
}

module.exports = {
    sendPostRequest,
    convertHTMLToPDF,
    getInvoiceTable,
    formatDate
};